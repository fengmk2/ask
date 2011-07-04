# An ask and answer system base on node.js


## Install

    $ sudo npm install express lingo mongoose
    
### mongodb 
    
下载

    $ wget http://fastdl.mongodb.org/linux/mongodb-linux-i686-1.8.1.tgz

启动脚步

    $ $HOME/local/mongodb/bin/mongod --dbpath=$HOME/data/mongodb --fork --logpath=$HOME/data/mongodb.log    
    
    
## Models

    Category
        ^
        |
        |
    Question <--------- Answer
        ^                 ^
        |                 |
        |                 |
       User              User
        

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