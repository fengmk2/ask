# An ask and answer system base on node.js


## Install

    $ sudo npm install express lingo mongoose
    $ cd support/
    $ git clone git://github.com/fengmk2/ejs.git
    $ git clone git://github.com/fengmk2/express-resource.git
    
### mongodb 
    
下载

    $ wget http://fastdl.mongodb.org/linux/mongodb-linux-i686-1.8.1.tgz

启动脚步

    $ $HOME/local/mongodb/bin/mongod --dbpath=$HOME/data/mongodb --fork --logpath=$HOME/data/mongodb.log    
    $ node server.js
    
## Models

    Category
        ^
        |
        |
    Question <--------------- Answer <-- Like
        ^                       ^
        |                       |
    Ask | Focus                 |
        |                       |
        |         follow        |
       User <--> Relation <--> User
       
    Log: 记录所有事情, 用户提问, 回答, 关注
    {
        id
        action: question, answer, focus, follow
        title
        target_id
        target_parent_id
        target_parent_title
        user_id
        created_at
    }

## TODO

1. post question: new, edit, delete
    * 我要提问
    * 搜索问题
    * 我的问题
2. post answer
 * 回答，修改，删除
 * 顶
 * 最佳回答
3. user sync !
4. csrf ！
5. html editor !
6. ！！用户关注，相互发信息

## home_timeline

包含用自己提交的问题, 关注用户有动作的问题(提问, 回答, 关注)

* 通过用户获得自己提问和关注的问题id
* 通过用户关注的所有用户的
