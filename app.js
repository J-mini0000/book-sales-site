const fs = require('fs');
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const FileStore = require('session-file-store')(session); // 세션을 파일에 저장
const cookieParser = require('cookie-parser');

// express 설정 1
const app = express();

// db 연결 2
const client = mysql.createConnection({
    user : 'root',
    password : 'qkqh14!@#$',
    database : 'erd'
});

// 정적 파일 설정 (미들웨어) 3
app.use(express.static(path.join(__dirname,'/public')));

// ejs 설정 4
app.set('views', __dirname + '\\views');
app.set('view engine','ejs');

// 정제 (미들웨어) 5
app.use(bodyParser.urlencoded({extended:false}));

// 세션 (미들웨어) 6
app.use(session({
    secret: 'blackzat', // 데이터를 암호화 하기 위해 필요한 옵션
    resave: false, // 요청이 왔을때 세션을 수정하지 않더라도 다시 저장소에 저장되도록
    saveUninitialized: true, // 세션이 필요하면 세션을 실행시칸다(서버에 부담을 줄이기 위해)
    store : new FileStore() // 세션이 데이터를 저장하는 곳
}));

app.get('/',(req,res)=>{
    console.log('메인페이지 작동');
    console.log(req.session);
    if(req.session.is_logined == true){
        res.render('index',{
            is_logined : req.session.is_logined,
            name : req.session.name
        });
    }else{
        res.render('index',{
            is_logined : false
        });
    }
});

// 회원가입
app.get('/register',(req,res)=>{
    console.log('회원가입 페이지');
    res.render('register');
});

app.post('/register',(req,res)=>{
    console.log('회원가입 하는중')
    const body = req.body;
    const id = body.membernumber;
    const pw = body.Member_password;
    const name = body.Member_name;
    

    client.query('select * from member where membernumber=?',[id],(err,data)=>{
        if(data.length == 0){
            console.log('회원가입 성공');
            client.query('insert into member(membernumber, Member_name, Member_password) values(?,?,?)',
            [
                id, name, pw
            ]);
            res.redirect('/');
        }else{
            console.log('회원가입 실패');
            res.send('<script>alert("회원가입 실패");</script>')
            res.redirect('/login');
        }
    });
});

// 로그인
app.get('/login',(req,res)=>{
    console.log('로그인 작동');
    res.render('login');
});

app.post('/login',(req,res)=>{
    const body = req.body;
    const id = body.membernumber;
    const pw = body.Member_password;

    client.query('select * from member where membernumber=?',[id],(err,data)=>{
        // 로그인 확인
        console.log(data[0]);
        console.log(id);
        console.log(data[0].membernumber);
        console.log(data[0].Member_password);
        console.log(id == data[0].membernumber);
        console.log(pw == data[0].Member_password);
        if(id == data[0].membernumber || pw == data[0].Member_password){
            console.log('로그인 성공');
            // 세션에 추가
            req.session.is_logined = true;
            req.session.name = data.name;
            req.session.id = data.membernumber;
            req.session.pw = data.Member_password;
            req.session.save(function(){ // 세션 스토어에 적용하는 작업
                res.render('index',{ // 정보전달
                    name : data[0].Member_name,
                    id : data[0].membernumber,
                    is_logined : true
                });
            });
        }else{
            console.log('로그인 실패');
            res.render('login');
        }
    });
    
});

// 로그아웃
app.get('/logout',(req,res)=>{
    console.log('로그아웃 성공');
    req.session.destroy(function(err){
        // 세션 파괴후 할 것들
        res.redirect('/');
    });

});


app.get('/list', (req, res)=>{
    var sql = 'SELECT * FROM BOOK';    
    client.query(sql, function (err, rows, fields) {
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else res.render('list.ejs', {list : rows});
    });
});

app.get('/write', function (req, res) {
    res.render('write.ejs');
});

app.post('/writeAf', function (req, res) {
    var body = req.body;
    console.log(body);

    var sql = 'INSERT INTO BOOK VALUES(?, ?, ?, ?)';
    var params = [body.Book_number, body.Book_name, body.Book_stock, body.Book_price];
    console.log(sql);
    client.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. insert fail...\n' + err);
        else res.redirect('/list');
    });
});

app.get('/addcard',(req,res)=>{
    console.log('카드추가');
    res.render('addcard');
});

app.post('/addcardAf', function (req, res) {
    var body = req.body;
    console.log(body);

    var sql = 'INSERT INTO card VALUES(?, ?, ?, ?)';
    var params = [body.Card_cardnumber, body.Card_term, body.Card_cardkinds, body.membernumber];
    console.log(sql);
    client.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. insert fail...\n' + err);
        else res.redirect('/');
    });
});

app.get('/addadress',(req,res)=>{
    console.log('주소추가');
    res.render('addadress');
});
app.post('/addadressAf', function (req, res) {
    var body = req.body;
    console.log(body);

    var sql = 'INSERT INTO adress VALUES(?, ?, ?, ?)';
    var params = [body.Adress_baseadress, body.membernumber, body.Adress_post_number, body.Adress_detailed_adress];
    console.log(sql);
    client.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. insert fail...\n' + err);
        else res.redirect('/');
    });
});


app.listen(3000,()=>{
    console.log('3000 port running...');
});