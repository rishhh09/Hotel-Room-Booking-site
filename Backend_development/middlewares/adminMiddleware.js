
const protectAdmin = async(req , res , next) => {
    if(req.user && req.user.role === "admin"){
         console.log('protectAdmin req.user=', req.user)
        next();
    }else{
        return res.status(403).json({message: 'Forbidden: Admin access required.'});
    }
}

module.exports = {protectAdmin};