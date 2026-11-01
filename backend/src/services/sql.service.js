/**
 * sql.service.js — Generic SQL Repository Service
 *
 * Provides a standardized CRUD abstraction over SQLite tables.
 * Replaces FirestoreService while maintaining contract compatibility
 * with existing controllers.
 *
 * Features:
 *   - Auto camelCase <-> snake_case translation
 *   - Flexible filtering, sorting, pagination
 *   - Fast, index-backed queries with zero composite index errors
 */
const { db } = require('../config/database');
const { NotFoundError } = require('../utils/ApiError');
const { PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');

// String helpers
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

// Whitelist of columns that are safe to use in ORDER BY clauses.
// Any caller-supplied column not in this set falls back to 'created_at'.
const ALLOWED_SORT_COLUMNS = new Set([
  'created_at', 'updated_at', 'order_num', 'rank_num',
  'academic_year', 'event_date', 'title', 'name', 'text',
  'class_grade', 'category', 'percentage', 'designation', 'type',
]);

function safeOrderByColumn(raw) {
  const snake = toSnakeCase(raw || 'createdAt');
  return ALLOWED_SORT_COLUMNS.has(snake) ? snake : 'created_at';
}

function rowToCamel(row) {
  if (!row) return null;
  const converted = {};
  for (const [key, val] of Object.entries(row)) {
    const camelKey = toCamelCase(key);
    // Convert SQLite 0/1 back to boolean for is* flags
    if (camelKey.startsWith('is') && (val === 0 || val === 1)) {
      converted[camelKey] = val === 1;
    } else {
      converted[camelKey] = val;
    }
  }
  return converted;
}

class SqlService {
  /**
   * @param {string} tableName - SQL table name (e.g. 'announcements')
   */
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Create a new record
   * @param {Object} data - CamelCase object
   * @returns {Promise<Object>} Created record with ID
   */
  async create(data) {
    const timestamp = new Date().toISOString();
    const prepared = { ...data };

    // Format boolean fields and boolean strings to 1/0
    for (const [k, v] of Object.entries(prepared)) {
      if (typeof v === 'boolean' || v === 'true' || v === 'false') {
        prepared[k] = (v === true || v === 'true') ? 1 : 0;
      }
    }

    const columns = [];
    const placeholders = [];
    const values = [];

    for (const [k, v] of Object.entries(prepared)) {
      if (v !== undefined) {
        columns.push(toSnakeCase(k));
        placeholders.push('?');
        values.push(v);
      }
    }

    // Include timestamps if not already provided (check both camelCase and snake_case)
    if (!prepared.createdAt && !prepared['created_at']) {
      columns.push('created_at');
      placeholders.push('?');
      values.push(timestamp);
    }
    if (!prepared.updatedAt && !prepared['updated_at']) {
      columns.push('updated_at');
      placeholders.push('?');
      values.push(timestamp);
    }

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const result = await db.run(sql, values);

    logger.debug(`[SQL] Inserted into '${this.tableName}' id: ${result.lastID}`);
    return this.getById(result.lastID);
  }

  /**
   * Get single record by ID
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const row = await db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    if (!row) {
      throw new NotFoundError(`${this.tableName} item with ID ${id}`);
    }
    return rowToCamel(row);
  }

  /**
   * Get all records with pagination, sorting, and filters
   * @param {Object} options
   */
  async getAll(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(1, parseInt(options.limit, 10) || PAGINATION.DEFAULT_LIMIT),
      PAGINATION.MAX_LIMIT
    );
    const offset = (page - 1) * limit;

    const orderByCol = safeOrderByColumn(options.orderBy || 'createdAt');
    const orderDir = (options.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClauses = [];
    const params = [];

    if (Array.isArray(options.filters)) {
      for (const filter of options.filters) {
        const col = toSnakeCase(filter.field);
        let val = filter.value;
        if (typeof val === 'boolean') val = val ? 1 : 0;

        if (filter.operator === '==' || filter.operator === '=') {
          whereClauses.push(`${col} = ?`);
          params.push(val);
        } else if (filter.operator === '!=') {
          whereClauses.push(`${col} != ?`);
          params.push(val);
        } else if (filter.operator === 'LIKE') {
          whereClauses.push(`${col} LIKE ?`);
          params.push(`%${val}%`);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countRow = await db.get(`SELECT COUNT(*) AS total FROM ${this.tableName} ${whereSql}`, params);
    const total = countRow ? countRow.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Data query
    const dataSql = `
      SELECT * FROM ${this.tableName}
      ${whereSql}
      ORDER BY ${orderByCol} ${orderDir}
      LIMIT ? OFFSET ?
    `;
    const rows = await db.all(dataSql, [...params, limit, offset]);

    return {
      data: rows.map(rowToCamel),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Unpaginated list for public frontend widgets
   * @param {Object} options
   */
  async list(options = {}) {
    const orderByCol = safeOrderByColumn(options.orderBy || 'createdAt');
    const orderDir = (options.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const maxResults = parseInt(options.maxResults, 10) || 50;

    const whereClauses = [];
    const params = [];

    if (Array.isArray(options.filters)) {
      for (const filter of options.filters) {
        const col = toSnakeCase(filter.field);
        let val = filter.value;
        if (typeof val === 'boolean') val = val ? 1 : 0;

        if (filter.operator === '==' || filter.operator === '=') {
          whereClauses.push(`${col} = ?`);
          params.push(val);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT * FROM ${this.tableName}
      ${whereSql}
      ORDER BY ${orderByCol} ${orderDir}
      LIMIT ?
    `;

    const rows = await db.all(sql, [...params, maxResults]);
    return rows.map(rowToCamel);
  }

  /**
   * Update an existing record
   * @param {number|string} id
   * @param {Object} data
   */
  async update(id, data) {
    const existing = await this.getById(id);
    const timestamp = new Date().toISOString();
    const setClauses = [];
    const values = [];

    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        let val = v;
        if (typeof val === 'boolean' || val === 'true' || val === 'false') {
          val = (val === true || val === 'true') ? 1 : 0;
        }
        setClauses.push(`${toSnakeCase(k)} = ?`);
        values.push(val);
      }
    }

    setClauses.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const sql = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE id = ?`;
    await db.run(sql, values);

    return this.getById(id);
  }

  /**
   * Delete a record by ID
   * @param {number|string} id
   */
  async delete(id) {
    const item = await this.getById(id);
    await db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return { id, deleted: true };
  }
}

module.exports = SqlService;
