const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
require('dotenv').config()

// 기존 db접속 npm install dotenv 을 사용하여 .env 파일 사용
// var db;
// MongoClient.connect('mongodb+srv://veriz:1234@cluster0.p0udg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(error, client){
//   if (error) {
//     return console.log(error)
//   }
//   db = client.db('todoapp');
//   app.listen(8080, function(){
//     console.log('listening on 8080')
//   });
//   // db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(에러, 결과){
//   //   console.log('저장완료'); 
//   // });
// });

// app.set('title', 'My Site')
// app.get('title') // "My Site"
// let test = app.get('title')
// console.log(test);
const storeObject = {}

const storeSetter = (key, value) => {
    storeObject[key] = value
}

const storeGetter = (key) => {
    return storeObject[key]
}

exports.storeSetter = storeSetter
exports.storeGetter = storeGetter

var db;
  MongoClient.connect(process.env.DB_URL, function(err, client){
  if (err) return console.log(err)
  db = client.db('todoapp');
  app.listen(process.env.PORT, function() {
    console.log('listening on 8080')
  })
});

app.get('/pet', function(request, response){
    response.send('펫 용품 페이지 입니다.');
});

app.get('/', function(request, response){
    console.log(exports.storeSetter('1', 'abc'));
    console.log(exports.storeGetter('1'));
    response.sendFile(__dirname+'/index.html');
});

app.get('/write', function(request, response){
  response.render('write.ejs')    
});





app.get('/list', function(request, response){
  db.collection('post').find().toArray(function(error, result){
    response.render('list.ejs', { posts : result })
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
  console.log('user1', user)
  done(null, user.id)
});
// 세션 아이디를 바탕으로 이 유저의 정보를 DB에서 찾아주세요.
passport.deserializeUser(function(id, done){
  db.collection('login').findOne({ id: id }, function (error, result) {
    done(null, result)
  })  
});

app.post('/register', function(request, response){
  // 아이디 중복 체크필요  
  db.collection('login').insertOne({id : request.body.id, pw : request.body.pw }, function(error, result){
    response.redirect('/');
  })
})

// 글 등록 기능
app.post('/add', function(request, response){
  response.send('전송완료');
  console.log('user', request.user);
  let boardCnt = 0;
  db.collection('counter').findOne( {name :'게시물갯수'} , function(error, result){
    boardCnt  = result.totalPost;
    console.log(request.body);
    let articleData = { _id : boardCnt+1, title : request.body.title, date : request.body.date, userName : request.user._id };
    // DB저장
    db.collection('post').insertOne( articleData , function(){
      console.log('저장완료');

      db.collection('counter').updateOne( {name :'게시물갯수'}, { $inc : {totalPost :  1 }}, function(error, result){
        if(error){
          return console.log(error);
        }
      })
    });      
  });
});

app.delete('/delete', function(request, response){  
  request.body._id = parseInt(request.body._id);

  let deleteDate = {_id : request.body._id, userName : request.user._id}
  console.log(typeof request.body._id)
  db.collection('post').deleteOne( request.body, function(error, result){
    if(error){
      console.log(error)
    }
    response.status(200).send({ message : '성공했습니다'});
  })
})

// // 검색
app.get('/search', (request, response) =>{
  console.log(request.query.value);

  // 텍스트 양이 많을때
  // 1. 날짜별로 자르기
  // 2. 띄어쓰기 단위로 indexing 금지
  // 3. 몽고 db search index설정하기
  // db.collection('post').find({title:request.query.value}).toArray((error, result)=>{
    // -> 한글 검색 제대로 안됨
  // db.collection('post').find( { $text : { $search: request.query.value }} ).toArray((error, result)=>{    
  var searchOption = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: request.query.value,
          path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }    
    } , 
    // { $sort : {_id : 1} } ,
    // { $limit : 10}, 
    // { $project : {title : 1, score : { $meta : "searchScore"} } } // 스코어 가져오기
  ]
    
  db.collection('post').aggregate(searchOption).toArray((error, result)=>{    
    console.log('검색결과', result);
    response.render('search.ejs', {posts : result})
  })
})




