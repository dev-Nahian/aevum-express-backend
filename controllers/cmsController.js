import CMS from "../models/CMS.js";

/**
 * @desc  Admin: Get all CMS entries
 * @route GET /api/admin/cms
 */
export const adminGetCMS = async (req, res, next) => {
  try {
    const entries = await CMS.find({}).sort({ key: 1 });
    res.json({ success: true, entries });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Upsert a CMS entry by key
 * @route PUT /api/admin/cms/:key
 */
export const adminUpsertCMS = async (req, res, next) => {
  try {
    const { value, label, type } = req.body;
    const entry = await CMS.findOneAndUpdate(
      { key: req.params.key },
      { value, label, type },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Delete a CMS entry
 * @route DELETE /api/admin/cms/:key
 */
export const adminDeleteCMS = async (req, res, next) => {
  try {
    await CMS.findOneAndDelete({ key: req.params.key });
    res.json({ success: true, message: "CMS entry deleted" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Public: Get CMS value by key
 * @route GET /api/cms/:key
 */
export const getCMSByKey = async (req, res, next) => {
  try {
    const entry = await CMS.findOne({ key: req.params.key });
    if (!entry) {
      return res.json({ success: false, value: null });
    }
    res.json({ success: true, value: entry.value, type: entry.type });
  } catch (error) {
    next(error);
  }
};
