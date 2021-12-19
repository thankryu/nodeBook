var router = require('express').Router();

function checkLogin(request, response, next){
    if(request.user){
        next()
    } else {
        response.send('로그인 안하셨는데요?')
    }
}
// 모든 라우터에 적용할 수 있는 미들웨어 선언
// router.use(checkLogin); 전체 적용
router.use('/shirts', checkLogin); // shirts일때만

router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
});
  
router.get('/pants', function(요청, 응답){
   응답.send('바지 파는 페이지입니다.');
}); 

// 이 파일에서 어떤 변수를 내보내겠습니다.
module.exports = router;