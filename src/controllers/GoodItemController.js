
import Item from "../models/GoodItem.js";

function generateSKU(itemName) {
  // 1) Item Code (first 2 letters of each word)
  const itemCode = itemName
    .split(" ")
    .map(w => w.substring(0, 2))
    .join("")
    .toUpperCase();

  // 2) Random 4-digit number
  const rand = Math.floor(1000 + Math.random() * 9000);

  return `${itemCode}-${rand}`;
}


// CREATE ITEM
export const createItem = async (req, res) => {
  try {
    const { name, uom, minLevel, reorderLevel, note ,status } = req.body;

    if (!name || !uom) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

  
     // AUTO SKU
    const sku = generateSKU(name);

    const exists = await Item.findOne({ sku });
    if (exists) return res.status(400).json({ success: false, message: "SKU already exists" });

    const item = await Item.create({
      name, sku, uom,
      minLevel: minLevel || 0,
      reorderLevel: reorderLevel || 0,
      status,
      note: note || "",
    });
    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error("createItem:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// LIST ITEMS with search, filter, pagination, sort
export const getItemDropdown = async (req, res) => {
  try {
    const items = await Item.find({ status: "Active" })
      .select("_id name sku")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const listItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
      sortBy = "createdAt",
      order = "desc"
    } = req.query;

    const q = {};

    if (search) {
      q.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (status) q.status = status;

    const skip =
      (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const items = await Item.find(q)
      .populate( "name")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(q);
    res.json({
      success: true,
      items,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("listItems:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE ITEM
export const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("name");
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, item });
  } catch (error) {
    console.error("getItem:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ITEM (do NOT touch currentStock here — stock module does that)
export const updateItem = async (req, res) => {
  try {
    const { name, category, uom, minLevel, reorderLevel, status, note } = req.body;

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { name, uom, minLevel, reorderLevel, status, note },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Item not found" });

    res.json({ success: true, item: updated });
  } catch (error) {
    console.error("updateItem:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE ITEM (soft-delete recommended; here we hard delete)
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // 🔥 SOFT DELETE
    item.status = "Inactive";
    await item.save();

    res.json({
      success: true,
      message: "Item marked as inactive",
    });
  } catch (error) {
    console.error("deleteItem:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

