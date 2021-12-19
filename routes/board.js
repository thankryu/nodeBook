var router = require('express').Router();

router.get('/sports', function(요청, 응답){
    응답.send('스포츠 게시판');
});
 
router.get('/game', function(요청, 응답){
    응답.send('게임 게시판');
}); 

 // 이 파일에서 어떤 변수를 내보내겠습니다.
module.exports = router;