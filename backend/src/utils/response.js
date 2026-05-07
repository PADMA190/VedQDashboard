'use strict';

function ok(res, data, message, meta) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  if (meta) payload.meta = meta;
  return res.json(payload);
}

function created(res, data, message) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  return res.status(201).json(payload);
}

function noContent(res) {
  return res.status(204).end();
}

function paginated(res, items, { page, limit, total }, message) {
  return ok(
    res,
    items,
    message,
    {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    }
  );
}

module.exports = { ok, created, noContent, paginated };
