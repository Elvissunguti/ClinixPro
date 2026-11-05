import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    const atoken = req.headers.atoken

    if (!atoken) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login again"
      })
    }

    const decoded = jwt.verify(atoken, process.env.JWT_SECRET)

    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login again"
      })
    }

    next()
  } catch (error) {
    console.log("AUTH ERROR:", error.message)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}

export default authAdmin
