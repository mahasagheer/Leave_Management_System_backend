const mongoose = require("mongoose");
const SystemSetting = new mongoose.Schema(
  {
    keyValuePairs: {
      type: Map,
      of: String,
    },
  },
  { strict: false }
);

const Setting = mongoose.model("setting", SystemSetting);
module.exports = Setting;
