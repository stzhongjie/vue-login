## 前言
前段时间和公司一个由技术转产品的同事探讨他的职业道路，对我说了一句深以为然的话：

*“不要把自己禁锢在某一个领域，技术到产品的转变，首先就是思维上的转变。你一直做前端，数据的交互你只知道怎么进，却不知道里面是怎么出的，这就是局限性。”*

醍醐灌顶般，刚好学习vue的时候看到有个注册登录的项目，索性我也跟着动手做一个vue项目，引入koa和mongodb，实现客户端（client）提交-服务端（server）接收返回-入数据库全过程。

本项目基于vue-cli搭建，利用token方式进行用户登录验证，并实现注册入库、读取用户、删除用户等功能。文章默认读者有一定的node和vue基础，基础部分不赘述。

系统环境：MacOS 10.13.3 

#### 关于npm安装速度慢或不成功

使用淘宝镜像安装

```
$ npm install -g cnpm --registry=https://registry.npm.taobao.org
```

然后所有的*npm install*改为*cnpm install*

## 项目流程图
为了让项目思路和所选技术更加清晰明了，画了一个图方便理解。

 ![image](http://images.vrm.cn/2018/04/09/vue-login.png)
 
## 项目启动

1.初始化项目 

```
$ npm install
``` 

2.启动项目 

```
$ npm run dev
```

3.启动MongoDB 

```
$ mongod --dbpath XXX
```
xxx是项目里*data*文件夹（也可以另行新建，数据库用于存放数据）的路径，也可直接拖入终端。

4.启动服务端 

```
$ node server.js
```


## 前端UI
vue的首选UI库我是选择了饿了么的Element-UI了，其他诸如*iview*、*vue-strap*好像没有ele全面。
#### 安装Element-UI
```
$ npm i element-ui -S
```
#### 引入Element-UI

```
//在项目里的mian.js里增加下列代码
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);
```

利用UI里面的选项卡切换做注册和登录界面的切换，以login组件作为整个登录系统的主界面，register组件作为独立组件切入。Element-UI的组成方式，表单验证等API请查阅官网。

```
//login组件
<template>
  <div class="login">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="登录" name="first">
        <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
          <el-form-item label="名称" prop="name">
            <el-input v-model="ruleForm.name"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="pass">
            <el-input type="password" v-model="ruleForm.pass" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm('ruleForm')">登录</el-button>
            <el-button @click="resetForm('ruleForm')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="注册" name="second">
        <register></register>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import register from '@/components/register'
export default {
  data() {
    var validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'));
      } else {
        if (this.ruleForm.checkPass !== '') {
          this.$refs.ruleForm.validateField('checkPass');
        }
        callback();
      }
    };
    return {
      activeName: 'first',
      ruleForm: {
        name: '',
        pass: '',
        checkPass: '',
      },
      rules: {
        name: [
          { required: true, message: '请输入您的名称', trigger: 'blur' },
          { min: 2, max: 5, message: '长度在 2 到 5 个字符', trigger: 'blur' }
        ],
        pass: [
          { required: true, validator: validatePass, trigger: 'blur' }
        ]
      },

    };
  },
  methods: {
    //选项卡切换
    handleClick(tab, event) {
    },
    //重置表单
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    //提交表单
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$message({
            type: 'success',
            message: '登录成功'
          });
          this.$router.push('HelloWorld');
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
  },
  components: {
    register
  }
}
</script>
<style rel="stylesheet/scss" lang="scss">
.login {
  width: 400px;
  margin: 0 auto;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.el-tabs__item {
  text-align: center;
  width: 60px;
}
</style>
```
接下来是注册组件

```
//register组件
<template>
  <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
    <el-form-item label="名称" prop="name">
      <el-input v-model="ruleForm.name"></el-input>
    </el-form-item>
    <el-form-item label="密码" prop="pass">
      <el-input type="password" v-model="ruleForm.pass" auto-complete="off"></el-input>
    </el-form-item>
    <el-form-item label="确认密码" prop="checkPass">
      <el-input type="password" v-model="ruleForm.checkPass" auto-complete="off"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm('ruleForm')">注册</el-button>
      <el-button @click="resetForm('ruleForm')">重置</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
export default {
  data() {
    var validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'));
      } else {
        if (this.ruleForm.checkPass !== '') {
          this.$refs.ruleForm.validateField('checkPass');
        }
        callback();
      }
    };
    var validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.ruleForm.pass) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };
    return {
      activeName: 'second',
      ruleForm: {
        name: '',
        pass: '',
        checkPass: '',
      },
      rules: {
        name: [
          { required: true, message: '请输入您的名称', trigger: 'blur' },
          { min: 2, max: 5, message: '长度在 2 到 5 个字符', trigger: 'blur' }
        ],
        pass: [
          { required: true, validator: validatePass, trigger: 'blur' }
        ],
        checkPass: [
          { required: true, validator: validatePass2, trigger: 'blur' }
        ],
      }
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$message({
            type: 'success',
            message: '注册成功'
          });
          // this.activeName: 'first',
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  }
}
</script>

```


## vue-router
*vue-router*是vue创建单页项目的核心，可以通过组合组件来组成应用程序，我们要做的是将组件(components)映射到路由(routes)，然后告诉*vue-router* 在哪里渲染它们。
上面的代码里已有涉及到一些路由切换，我们现在来完善路由：

#### 安装

```
$ cnpm i vue-router
```
#### 引入
```
import Router from 'vue-router'
Vue.use(Router)
```

在src文件夹下面新建 router（文件夹）/index.js
我们引入了三个组件：

HelloWorld 登录后的展示页

login      登录主界面

register   注册组件

#### 路由守卫

利用*router.beforeEach*路由守卫设置需要先登录的页面。通过*requiresAuth*这个字段来判断该路由是否需要登录权限，需要权限的路由就拦截，然后再判断是否有token(下文会讲到token)，有就直接登录，没有就跳到登录页面。

```
import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import login from '@/components/login'
import register from '@/components/register'
Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [{
      path: '/',
      name: 'home',
      component: HelloWorld,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/HelloWorld',
      name: 'HelloWorld',
      component: HelloWorld,
    },
    {
      path: '/login',
      name: 'login',
      component: login,
    },
    {
      path: '/register',
      name: 'register',
      component: register,
    },
  ]
});

//注册全局钩子用来拦截导航
router.beforeEach((to, from, next) => {
  //获取store里面的token
  let token = store.state.token;
  //判断要去的路由有没有requiresAuth
  if (to.meta.requiresAuth) {
    if (token) {
      next();
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 将刚刚要去的路由path作为参数，方便登录成功后直接跳转到该路由
      });
    }
  } else {
    next(); 
  }
});
export default router;
```

我们可以看到路由守卫中token是从store里面获取的，意味着我们是把token的各种状态存放到store里面，并进行获取，更新，删除等操作，这就需要引入vuex状态管理。
## vuex

解释一下为什么一个简单的注册登录单页需要用到vuex：项目中我们各个组件的操作基本都需要获取到token进行验证，如果组件A存储了一个token，组件B要获取这个token就涉及到了组件通信，这会非常繁琐。引入vuex，不再是组件间的通信，而是组件和store的通信，简单方便。

#### 安装
```
$ cnpm i vuex --S
```

#### 引入

在main.js引入store，vue实例中也要加入store

```
//引入store
import store from './store'
```
然后在需要使用vuex的组件中引入

```
//store index.js
import Vuex from 'vuex'
Vue.use(Vuex)
```
在src文件夹下面新建 store（文件夹）/index.js

```
//store index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

//初始化时用sessionStore.getItem('token'),这样子刷新页面就无需重新登录
const state = {
    token: window.sessionStorage.getItem('token'),
    username: ''
};

const mutations = {
    LOGIN: (state, data) => {
        //更改token的值
        state.token = data;
        window.sessionStorage.setItem('token', data);
    },
    LOGOUT: (state) => {
        //登出的时候要清除token
        state.token = null;
        window.sessionStorage.removeItem('token');
    },
    USERNAME: (state, data) => {
        //把用户名存起来
        state.username = data;
        window.sessionStorage.setItem('username', data);
    }
};

const actions = {
    UserLogin({ commit }, data){
        commit('LOGIN', data);
    },
    UserLogout({ commit }){
        commit('LOGOUT');
    },
    UserName({ commit }, data){
        commit('USERNAME', data);
    }
};

export default new Vuex.Store({
    state,
    mutations,
    actions
});
```
可以看到我们通过actions提交mutation，进行token的更改、清除以及用户名储存的操作。                     


此时启动项目，可以看到初步的注册登录界面，点击注册或登录按钮可以切换到相应界面，并有基础的表单验证，登录后会进入helloworld页面。

![image](http://images.vrm.cn/2018/04/09/GIF1.gif)

我们写好了基础界面，接下来就是要把表单数据发送到后台并进行一系列处理。现在还没有后端接口没关系，我们先写好前端axios请求。

## axios
vue的通讯之前使用*vue-resource*，有很多坑。直到vue2.0来临，直接抛弃*vue-resource*，而使用*axios*。

#### 用途：
封装ajax，用来发送请求，异步获取数据。以Promise为基础的HTTP客户端，适用于：浏览器和node.js。

具体API中文说明：https://www.kancloud.cn/yunye/axios/234845

#### 安装
```
$ cnpm i -S axios
```

#### 引入
```
import axios from 'axios'
```

#### 拦截器

在设置vue-router那部分加入了路由守卫拦截需要登录的路由，但这种方式只是简单的前端路由控制，并不能真正阻止用户访问需要登录权限的路由。当token失效了，但token依然保存在本地。这时候你去访问需要登录权限的路由时，实际上应该让用户重新登录。这时候就需要拦截器*interceptors* + 后端接口返回的http状态码来判断。

在src文件夹下面新建axios.js(和App.vue同级)

```
//axios.js
import axios from 'axios'
import store from './store'
import router from './router'

//创建axios实例
var instance = axios.create({
  timeout: 5000, //请求超过5秒即超时返回错误
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
});

//request拦截器
instance.interceptors.request.use(
  config => {
    //判断是否存在token，如果存在的话，则每个http header都加上token
    if (store.state.token) {
      config.headers.Authorization = `token ${store.state.token}`;
    }
    return config;
  }
);

//respone拦截器
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => { //默认除了2XX之外的都是错误的，就会走这里
    if (error.response) {
      switch (error.response.status) {
        case 401:
          router.replace({ //跳转到登录页面
            path: 'login',
            query: { redirect: router.currentRoute.fullPath } // 将跳转的路由path作为参数，登录成功后跳转到该路由
          });
      }
    }
    return Promise.reject(error.response);
  }
);

export default {
    //用户注册
    userRegister(data){
        return instance.post('/api/register', data);
    },
    //用户登录
    userLogin(data){
        return instance.post('/api/login', data); 
    },
    //获取用户
    getUser(){
        return instance.get('/api/user');
    },
    //删除用户
    delUser(data){
        return instance.post('/api/delUser', data);
    }
}
```
代码最后暴露了四个请求方法，分别对应注册(register)、登录(login)、获取(user)、删除(delUser)用户，并且都在/api下面，四个请求接口分别是：

```
http://localhost:8080/api/login
http://localhost:8080/api/register
http://localhost:8080/api/user
http://localhost:8080/api/delUser
```

后面我们再利用这四个方法写相对应的后台接口。

## 服务端 server
### 注意
文章从这里开始进入服务端，由于服务端需要和数据库、http安全通讯（jwt）共同搭建，因此请结合本节和下面的数据库、jwt章节阅读。

koa2可以使用可以使用async/await语法，免除重复繁琐的回调函数嵌套，并使用ctx来访问Context对象。

现在我们用koa2写项目的API服务接口。

#### 安装
```
$ cnpm i koa
$ cnpm i koa-router -S      //koa路由中间件
$ cnpm i koa-bodyparser -S  //处理post请求，并把koa2上下文的表单数据解析到ctx.request.body中
```

#### 引入
```
const Koa = require('koa');
```

在项目根目录下面新建server.js，作为整个server端的启动入口。

```
//server.js
const Koa = require('koa');
const app = new Koa();

//router
const Router = require('koa-router');

//父路由
const router = new Router();

//bodyparser:该中间件用于post请求的数据
const bodyParser = require('koa-bodyparser');
app.use(bodyParser());

//引入数据库操作方法
const UserController = require('./server/controller/user.js');

//checkToken作为中间件存在
const checkToken = require('./server/token/checkToken.js');

//登录
const loginRouter = new Router();
loginRouter.post('/login', UserController.Login);
//注册
const registerRouter = new Router();
registerRouter.post('/register', UserController.Reg);

//获取所有用户
const userRouter = new Router();
userRouter.get('/user', checkToken, UserController.GetAllUsers);
//删除某个用户
const delUserRouter = new Router();
delUserRouter.post('/delUser', checkToken, UserController.DelUser);

//装载上面四个子路由
router.use('/api',loginRouter.routes(),loginRouter.allowedMethods());
router.use('/api',registerRouter.routes(),registerRouter.allowedMethods());
router.use('/api',userRouter.routes(),userRouter.allowedMethods());
router.use('/api',delUserRouter.routes(),delUserRouter.allowedMethods());

//加载路由中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(8888, () => {
    console.log('The server is running at http://localhost:' + 8888);
});

```
代码里可以看到，获取用户和删除用户都需要验证token（详见下文jwt章节），并且我们把四个接口挂在到了/api上，和前面axios的请求路径一致。

#### 接口地址配置
另外由于我们的项目启动端口是8080，koa接口监听的端口是8888，于是需要在config/index.js文件里面，在dev配置里加上：

```
proxyTable: {
	'/api': {
		target: 'http://localhost:8888',
		changeOrigin: true
	}
},
```

## jsonwebtoken（JWT）

JWT能够在HTTP通信过程中，帮助我们进行身份认证。

具体API详见：https://segmentfault.com/a/1190000009494020

#### Json Web Token是怎么工作的？
1、客户端通过用户名和密码登录服务器；

2、服务端对客户端身份进行验证；

3、服务端对该用户生成Token，返回给客户端；

4、客户端将Token保存到本地浏览器，一般保存到cookie（本文是用sessionStorage，看情况而定）中；

5、客户端发起请求，需要携带该Token；

6、服务端收到请求后，首先验证Token，之后返回数据。服务端不需要保存Token，只需要对Token中携带的信息进行验证即可。无论客户端访问后台的哪台服务器，只要可以通过用户信息的验证即可。

在server文件夹，下面新建/token(文件夹)里面新增checkToken.js和createToken.js，分别放置检查和新增token的方法。

#### 安装

```
$ cnpm i jsonwebtoken -S
```

#### createToken.js
```
const jwt = require('jsonwebtoken');
module.exports = function(user_id){
    const token = jwt.sign({user_id: user_id}, 'zhangzhongjie', {expiresIn: '60s'
    });
    return token;
};

```
创建token时，我们把用户名作为JWT Payload的一个属性，并且把密钥设置为‘zhangzhongjie’,token过期时间设置为60s。意思是登录之后，60s内刷新页面不需要再重新登录。
#### checkToken.js
```
const jwt = require('jsonwebtoken');
//检查token是否过期
module.exports = async ( ctx, next ) => {
    //拿到token
    const authorization = ctx.get('Authorization');
    if (authorization === '') {
        ctx.throw(401, 'no token detected in http headerAuthorization');
    }
    const token = authorization.split(' ')[1];
    let tokenContent;
    try {
        tokenContent = await jwt.verify(token, 'zhangzhongjie');//如果token过期或验证失败，将抛出错误
    } catch (err) {
        ctx.throw(401, 'invalid token');
    }
    await next();
};
```
先拿到token再用jwt.verify进行验证，注意此时密钥要对应上createToken.js的密钥‘zhangzhongjie’。如果token为空、过期、验证失败都抛出401错误，要求重新登录。

## 数据库 mongodb

MongoDB是一种文档导向数据库管理系统，旨在为 WEB 应用提供可扩展的高性能数据存储解决方案。用node链接MongoDB非常方便。

#### 安装
```
$ cnpm i mongoose -S
```

MongoDB的连接有好几种方式，这里我们用connection。connection是mongoose模块的默认引用，返回一个Connetion对象。

在server文件夹下新建db.js，作为数据库连接入口。

```
//db.js
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/vue-login');

let db = mongoose.connection;
// 防止Mongoose: mpromise 错误
mongoose.Promise = global.Promise;

db.on('error', function(){
    console.log('数据库连接出错！');
});
db.on('open', function(){
    console.log('数据库连接成功！');
});

//声明schema
const userSchema = mongoose.Schema({
    username: String,
    password: String,
    token: String,
    create_time: Date
});
//根据schema生成model
const User = mongoose.model('User', userSchema)

module.exports = User;
```
除了我们用的*connetion*，还有*connect()*和*createConnection()*连接方式。

Schema定义表的模板，让这一类document在数据库中有一个具体的构成、存储模式。但也仅仅是定义了Document是什么样子的，至于生成document和对document进行各种操作（增删改查）则是通过相对应的model来进行的，那我们就需要把userSchema转换成我们可以使用的model，也就是说model才是我们可以进行操作的handle。

编译完model我们就得到了一个名为*User*的model。

注意你在这里定义的schema表，后面写注册入库时数据的存储需要对应这个表。

在server文件夹下新建controller(文件夹)/user.js,存放数据库的操作方法。

先安装一些功能插件

```
$ cnpm i moment -s                 //用于生成时间
$ cnpm i objectid-to-timestamp -s  //用于生成时间
$ cnpm i sha1 -s                   //安全哈希算法，用于密码加密
```

```
//user.js
const User = require('../db.js').User;
//下面这两个包用来生成时间
const moment = require('moment');
const objectIdToTimestamp = require('objectid-to-timestamp');
//用于密码加密
const sha1 = require('sha1');
//createToken
const createToken = require('../token/createToken.js');

//数据库的操作
//根据用户名查找用户
const findUser = (username) => {
    return new Promise((resolve, reject) => {
        User.findOne({ username }, (err, doc) => {
            if(err){
                reject(err);
            }
            resolve(doc);
        });
    });
};
//找到所有用户
const findAllUsers = () => {
    return new Promise((resolve, reject) => {
        User.find({}, (err, doc) => {
            if(err){
                reject(err);
            }
            resolve(doc);
        });
    });
};
//删除某个用户
const delUser = function(id){
    return new Promise(( resolve, reject) => {
        User.findOneAndRemove({ _id: id }, err => {
            if(err){
                reject(err);
            }
            console.log('删除用户成功');
            resolve();
        });
    });
};
//登录
const Login = async ( ctx ) => {
    //拿到账号和密码
    let username = ctx.request.body.name;
    let password = sha1(ctx.request.body.pass);//解密
    let doc = await findUser(username);    
    if(!doc){
        console.log('检查到用户名不存在');
        ctx.status = 200;
        ctx.body = {
            info: false
        }
    }else if(doc.password === password){
        console.log('密码一致!');

         //生成一个新的token,并存到数据库
        let token = createToken(username);
        console.log(token);
        doc.token = token;
        await new Promise((resolve, reject) => {
            doc.save((err) => {
                if(err){
                    reject(err);
                }
                resolve();
            });
        });
        ctx.status = 200;
        ctx.body = { 
            success: true,
            username,
            token, //登录成功要创建一个新的token,应该存入数据库
            create_time: doc.create_time
        };
    }else{
        console.log('密码错误!');
        ctx.status = 200;
        ctx.body = {
            success: false
        };
    }
};
//注册
const Reg = async ( ctx ) => {
    let user = new User({
        username: ctx.request.body.name,
        password: sha1(ctx.request.body.pass), //加密
        token: createToken(this.username), //创建token并存入数据库
        create_time: moment(objectIdToTimestamp(user._id)).format('YYYY-MM-DD HH:mm:ss'),//将objectid转换为用户创建时间
    });
    //将objectid转换为用户创建时间(可以不用)
    user.create_time = moment(objectIdToTimestamp(user._id)).format('YYYY-MM-DD HH:mm:ss');

    let doc = await findUser(user.username);
    if(doc){ 
        console.log('用户名已经存在');
        ctx.status = 200;
        ctx.body = {
            success: false
        };
    }else{
        await new Promise((resolve, reject) => {
            user.save((err) => {
                if(err){
                    reject(err);
                }   
                resolve();
            });
        });
        console.log('注册成功');
        ctx.status = 200;
        ctx.body = {
            success: true
        }
    }
};
//获得所有用户信息
const GetAllUsers = async( ctx ) => {
    //查询所有用户信息
    let doc = await findAllUsers();
    ctx.status = 200;
    ctx.body = {
        succsess: '成功',
        result: doc
    };
};

//删除某个用户
const DelUser = async( ctx ) => {
    //拿到要删除的用户id
    let id = ctx.request.body.id;
    await delUser(id);
    ctx.status = 200;
    ctx.body = {
        success: '删除成功'
    };
};

module.exports = {
    Login,
    Reg,
    GetAllUsers,
    DelUser
};
```

上面这些方法构成了项目中数据库操作的核心，我们来剖析一下。

首先定义了公用的三个基础方法：findUser、findAllUsers、delUser。其中findUser需要传入*username*参数，delUser需要传入*id*参数。

#### 注册方法

拿到用户post提交的表单信息，new之前按数据库设计好的并编译成model的User，把获取到的用户名，密码（需要用sha1哈希加密），token（利用之前创建好的createToken方法，并把用户名作为jwt的payload参数），生成时间存入。

此时要先搜索数据库这个用户名是否存在，存在就返回失败，否则把user存入数据库并返回成功。

#### 登录方法

拿到用户post的表单信息，用户名和密码（注册用了哈希加密，此时要解密）。从数据库搜索该用户名，判断用户名是否存在，不存在返回错误，存在的话判断数据库里存的密码和用户提交的密码是否一致，一致的话给这个用户生成一个新的token，并存入数据库，返回成功。

#### 获得所有用户信息

就是把上面公用findAllUsers方法封装了一下并把信息放在result里面，让后面helloworld页面可以获取到这个数据并展示出来。

#### 删除某个用户

注意要先拿到需要删除的用户id，作为参数传入。

写完这些方法，就可以把前面没有完善的注册登录功能完善了。

#### 数据库可视化

当我们注册完，数据入库，此时我们想查看一下刚才注册入库的数据，要用到数据库可视化工具。我是用*MongoBooster*，操作简单。

由下图可以看到示例中注册的两条数据，包含了id、username、password、token、time。那串长长的密码是由于哈希加密编译而成。

![image](http://images.vrm.cn/2018/04/09/MongoDB.png)

## 整合
#### 完善注册组件
在register.vue的表单验证后加上下列代码

```
//register.vue
if (valid) {
  axios.userRegister(this.ruleForm)
    .then(({}) => {
      if (data.success) {
        this.$message({
          type: 'success',
          message: '注册成功'
        });
      } else {
        this.$message({
          type: 'info',
          message: '用户名已经存在'
        });
      }
    })
}
```
#### 完善登录组件
登录组件我们之前没有任何数据提交，现在在验证成功后加入一系列方法完成登录操作：
引入axios

```
import axios from '../axios.js'
```
然后在login.vue的表单验证后加上下列代码

```
//login.vue
if (valid) {
  axios.userLogin(this.ruleForm)
    .then(({ data }) => {
      //账号不存在
      if (data.info === false) {
        this.$message({
          type: 'info',
          message: '账号不存在'
        });
        return;
      }
      //账号存在
      if (data.success) {
        this.$message({
          type: 'success',
          message: '登录成功'
        });
        //拿到返回的token和username，并存到store
        let token = data.token;
        let username = data.username;
        this.$store.dispatch('UserLogin', token);
        this.$store.dispatch('UserName', username);
        //跳到目标页
        this.$router.push('HelloWorld');
      }
    });
}
```
将表单数据提交到后台，返回data状态，进行账号存在与否的判断操作。登录成功需要拿到返回的token和username存到store，跳到目标HelloWorld页。

#### 完善目标页组件

注册登录成功后，终于到了实际的展示页了——helloworld！

我们来完善这个组件，让它展示出目前所有的已注册用户名，并给出删除按钮。

```
//Helloworld.vue
<template>
  <div class="hello">
    <ul>
      <li v-for="(item,index) in users" :key="item._id">
        {{ index + 1 }}.{{ item.username }}
        <el-button @click="del_user(index)">删除</el-button>
      </li>
    </ul>
    <el-button type="primary" @click="logout()">注销</el-button>
  </div>
</template>

<script>
import axios from '../axios.js'
export default {
  name: 'HelloWorld',
  data () {
    return {
      users:''
    }
  },
  created(){
    axios.getUser().then((response) => {
      if(response.status === 401){
        //不成功跳转回登录页
        this.$router.push('/login');
        //并且清除掉这个token
        this.$store.dispatch('UserLogout');
      }else{
        //成功了就把data.result里的数据放入users，在页面展示
        this.users = response.data.result;
      }
    })
  },
  methods:{
    del_user(index, event){
      let thisID = {
        id:this.users[index]._id
      }
      axios.delUser(thisID)
        .then(response => {
          this.$message({
            type: 'success',
            message: '删除成功'
          });
          //移除节点
          this.users.splice(index, 1);
        }).catch((err) => {
          console.log(err);
      });
    },
    logout(){
      //清除token
      this.$store.dispatch('UserLogout');
      if (!this.$store.state.token) {
        this.$router.push('/login')
        this.$message({
          type: 'success',
          message: '注销成功'
        })
      } else {
        this.$message({
          type: 'info',
          message: '注销失败'
        })
      }
    },
  }
}
</script>

<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.hello {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 400px;
  margin: 60px auto 0 auto;
}
</style>
```

输出页面比较简单，这里说几个要点：

1.要在实例创建完成后（*created()*）立即请求getUser()接口，请求失败要清除掉token，请求成功要把返回数据放入user以供页面渲染。

2.*thisID*要写成对象格式，否则会报错

3.注销时要清除掉token

## 总结

人的思维转变确实是最难的。按流程来说，应该是koa先设计出接口，前端再根据这个接口去请求，但我反过来，是先写好前端请求，再根据这个请求去制定接口。

当然，也遇到了很多困难：当我搞好了前端展示页面，axios也写好了，但在用koa写接口这里卡了很久，完全没有概念，就是前言说的“只知道数据怎么进，不知道怎么出”。然后遇到接口500报错又调试了很久，主要是自己对接口没有调试概念，最后还是公司的琅琊大佬帮忙解决，感谢。
