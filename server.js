const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient

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
      db.collection('post').insertOne( { _id : boardCnt+1, title : request.body.title, data : request.body.date } , function(){
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

