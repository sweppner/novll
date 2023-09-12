// route middleware to ensure user is logged in
function checkLogin(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }else{
    res.json({error:'Please Log In'})
  }
}
module.exports = checkLogin;