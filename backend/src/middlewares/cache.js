/**
 * cache.js — Cache-Control header middleware
 *
 * Provides configurable cache headers for different endpoint types:
 *   - publicCache(maxAge): Browser + CDN caching for public content
 *   - privateCache(maxAge): Browser-only caching for authenticated content
 *   - noCache(): No caching for admin/mutation endpoints
 *
 * Usage in routes:
 *   router.get('/', publicCache(300), controller.list);    // 5 min cache
 *   router.get('/:id', publicCache(60), controller.get);   // 1 min cache
 *   router.post('/', noCache(), controller.create);         // no cache
 */

/**
 * Set Cache-Control for public, cacheable content
 * @param {number} maxAge - Max age in seconds (default: 300 = 5 minutes)
 * @returns {Function} Express middleware
 */
function publicCache(maxAge = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
      res.setHeader('Vary', 'Accept-Encoding');
    }
    next();
  };
}

/**
 * Set Cache-Control for private, user-specific content
 * @param {number} maxAge - Max age in seconds (default: 60)
 * @returns {Function} Express middleware
 */
function privateCache(maxAge = 60) {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
    }
    next();
  };
}

/**
 * Disable caching entirely — for admin endpoints and mutations
 * @returns {Function} Express middleware
 */
function noCache() {
  return (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  };
}

module.exports = { publicCache, privateCache, noCache };
