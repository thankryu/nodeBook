const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://veriz:1234@cluster0.p0udg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(error, client){
  if (error) {
    return console.log(error)
  }
  db = client.db('todoapp');
  
  // db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(에러, 결과){
  //   console.log('저장완료'); 
  // });
})

app.listen(8080, function(){
    console.log('listening on 8080')
});

app.get('/pet', function(request, response){
    response.send('펫 용품 페이지 입니다.');
});

app.get('/', function(request, response){
    response.sendFile(__dirname+'/index.html');
});

app.get('/write', function(request, response){
    response.sendFile(__dirname+'/write.html');
});

app.post('/add', function(request, response){
    response.send('전송완료');
    let boardCnt = 0;
    db.collection('counter').findOne( {name :'게시물갯수'} , function(error, result){
      console.log("결과:::", result.totalPost);
      boardCnt  = result.totalPost;
      // DB저장
      db.collection('post').insertOne( { _id : boardCnt+1, title : request.body.title, date : request.body.date } , function(){
        console.log('저장완료');

        db.collection('counter').updateOne( {name :'게시물갯수'}, { $inc : {totalPost :  1 }}, function(error, result){
          if(error){
            return console.log(error);
          }
        })
      });      
    });
});

app.get('/list', function(request, response){
  db.collection('post').find().toArray(function(error, result){
    response.render('list.ejs', { posts : result })
  })
})

app.delete('/delete', function(request, response){  
  request.body._id = parseInt(request.body._id);
  console.log(typeof request.body._id)
  db.collection('post').deleteOne( request.body, function(error, result){
    response.status(200).send({ message : '성공했습니다'});
  })
})

app.get('/detail/:id', function(request, response){
  db.collection('post').findOne({_id : parseInt(request.params.id)}, function(error, result){
    console.log(result);
    response.render('detail.ejs', { data : result} );
  })
});

app.get('/edit/:id', function(request, response){
  db.collection('post').findOne({_id : parseInt(request.params.id) }, function(error, result){    
    response.render('edit.ejs', {post : result });
  })
});

app.put('/edit', function(request, response){
  // 폼에 담긴 제목, 날짜 데이터를 가지고 db.collection에 업데이트 함
  console.log(request.body);
  db.collection('post').updateOne({_id : parseInt(request.body.id)}, {$set : {title : request.body.title, date : request.body.date }}, function(error, result){
    response.redirect('/list');
  })
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// app.use 미들웨어를 쓰겠습니다.
// 미들웨어 : 요청-응답 중간에 실행되는 코드
app.use(session({secret : 'secretCode', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(request, response){  
  response.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), function(request, response){
   response.redirect('/');
});

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (id, pw, done) {
  console.log(id, pw);
  db.collection('login').findOne({ id: id }, function (error, result) {
    if (error){
      return done(error);      
    } 

    if (!result) {
      return done(null, false, { message: '존재하지않는 아이디요' })      
    }
    if (pw == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));
// done ( 서버에러, 성공 시 사용자 data, 메시지)
// id를 이용해서 세션을 저장시키는 코드(로그인 성공 시 발동)
passport.serializeUser(function(user, done){
  done(null, user.id)
});

passport.deserializeUser(function(id, done){
  done(null, {})
});