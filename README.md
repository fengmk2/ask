# An ask and answer system base on node.js


## Install

    $ sudo npm install express express-resource mongoose
    
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
3. user sync !
4. csrf ！
5. html editor