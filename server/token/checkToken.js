const jwt = require('jsonwebtoken');
//检查token是否过期
module.exports = async ( ctx, next ) => {
    //拿到token
    
    //console.log(ctx.request);的输出
        // { method: 'GET',
        // url: '/api/user',
        // header:
        // { 'accept-language': 'zh-CN,zh;q=0.8',
        //     'accept-encoding': 'gzip, deflate, sdch, br',
        //     referer: 'http://localhost:8000/',
        //     authorization: 'token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzMTIzMTIzIiwiaWF0IjoxNDk0NDA1MDg4LCJleHAiOjE0OTQ0MDUwODh9.57iy3sL9TG0MTXBS7Xr6SS0QGRZObrivUloy-25NBqg',
        //     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.98 Safari/537.36',
        //     accept: 'application/json, text/plain, */*',
        //     connection: 'close',
        //     host: 'localhost:8888' } }
    
    // if(ctx.request.header['authorization']){
    //     let token = ctx.request.header['authorization'].split(' ')[1];
    //     console.log(token)
    //     //解码token
    //     let decoded = jwt.decode(token, 'sinner77');
    //     //console.log(decoded);的输出 ：{ user_id: '123123123', iat: 1494405235, exp: 1494405235 }
    //     if(token && decoded.exp <= new Date()/1000){
    //         ctx.status = 401;
    //         ctx.body = {
    //             message: 'token过期'
    //         };
    //     }else{
    //         //如果权限没问题，那么交个下一个控制器处理
    //         return next();
    //     }
    // }else{
    //     ctx.status = 401;
    //     ctx.body = {
    //         message: '没有token'
    //     }
    // }
    const authorization = ctx.get('Authorization');
    if (authorization === '') {
        ctx.throw(401, 'no token detected in http headerAuthorization');
    }
    const token = authorization.split(' ')[1];
    let tokenContent;
    try {
        tokenContent = await jwt.verify(token, 'zhangzhongjie');     //如果token过期或验证失败，将抛出错误
    } catch (err) {
        ctx.throw(401, 'invalid token');
    }
    await next();
    //看到这里请继续读完下面的代码
};

// 上面的 jwt.decode(token, 'sinner77') 只是把信息解密出来，然后再验证是否还在有效期以内
// 但是这个sinner77的参数是无效的，直接使用jwt.decode(token)或者jwt.decode(token, 'xxxx')
// 解密出来的信息都是一致的，相当于没有对这个token进行是否合法的验证，达不到登录基本的安全性
// 请使用下面的代码
// module.exports = async ( ctx, next ) => {
//     const authorization = ctx.get('Authorization');
//     if (authorization === '') {
//         ctx.throw(401, 'no token detected in http header 'Authorization'');
//     }
//     const token = authorization.split(' ')[1];
//     let tokenContent;
//     try {
//         tokenContent = await jwt.verify(token, 'sinner77');     //如果token过期或验证失败，将抛出错误
//     } catch (err) {
//         ctx.throw(401, 'invalid token');
//     }
//     await next();
// }
