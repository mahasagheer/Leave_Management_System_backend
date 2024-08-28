const Setting = require("../modal/systemSetting");

async function CreateTheme(req, res) {
  try {
    const bgColor = req.body.color;
    const logo = req.file.filename;
    const setSetting = await Setting.create({
      keyValuePairs: {
        color: bgColor,
        logo: logo,
      },
    });
    return res.status(200);
  } catch (err) {
    return res.status(500).json({ msg: "Can't upload file" });
  }
}
async function getLogo(req, res) {
  try {
    const images = await Setting.findOne({ _id: req.params.id });
    if (!images) {
      return res.status(400).json({ msg: "Image Not found" });
    }
    const logoPath = images.keyValuePairs.get("logo");
    const color = images.keyValuePairs.get("color");
    return res
      .status(200)
      .json({ msg: "get image successfully", image: logoPath, color: color });
  } catch (err) {
    return res.status(500).json({ msg: "unable to get images" });
  }
}
module.exports = { CreateTheme, getLogo };
