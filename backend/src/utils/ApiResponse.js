/**
 * ApiResponse — Standardized JSON response wrapper
 * Ensures every API response follows the same format across the entire application.
 */
class ApiResponse {
  /**
   * Send a success response
   * @param {import('express').Response} res
   * @param {*} data - Response payload
   * @param {string} message - Human-readable message
   * @param {number} statusCode - HTTP status (default 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send a no-content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send a paginated list response
   * @param {import('express').Response} res
   * @param {Array} data - Array of items
   * @param {object} pagination - { page, limit, total, totalPages }
   * @param {string} message
   */
  static paginated(res, data, pagination, message = 'Data fetched successfully') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}

module.exports = ApiResponse;
