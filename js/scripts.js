window.onload = function() {

    var myAudio = $("audio")[0];
    var lyricArr = [];

    //播放、停止
    $(".btn2").click(function () {
        if (myAudio.paused) {
            play();
        } else {
            pause();
        }
    });

    //频道切换
    $(".btn1").click(function () {
        getChannel();
    });

    //换曲
    $(".btn3").click(function () {
        getMusic()
    });

    function play() {
        myAudio.play();
        $(".btn2").removeClass("header-play").addClass("header-pause");
    }

    function pause() {
        myAudio.pause();
        $(".btn2").removeClass("header-pause").addClass("header-play");
    }

    //通过ajax获取频道
    function getChannel() {
        $.ajax({
            url: 'http://api.jirengu.com/fm/getChannels.php',
            dataType: 'json',
            Method: 'get',
            success: function (response) {
                var channels = response.channels;
                var num = Math.floor(Math.random()*channels.length); //对随机频道取整
                var channelName = channels[num].name; //频道名称
                var channelId = channels[num].channel_id; //频道ID
                // console.log(channels);
                $('.record').text(channelName);
                $('.record').attr('title', channelName); //把频道名称放到title里面
                $('.record').attr('data-id', channelId); //把频道id放到data-id中
                getMusic();
            }
        });
    }
    getChannel();


    //获取歌曲
    function getMusic() {
        $.ajax({
            url: 'http://api.jirengu.com/fm/getSong.php',
            dataType: 'json',
            Method: 'get',
            data: {
                'channel': $('.record').attr('data-id')  // getchannel函数中获取到的随机频道id放到channel中
            },
            success: function (ret) {
                var songObj = ret.song[0],
                    url = songObj.url,
                    bgPic = songObj.picture, //背景图片
                    sid = songObj.sid,       //歌词参数
                    ssid = songObj.ssid,     //歌词参数
                    title = songObj.title,   //歌名
                    singer = songObj.artist; //歌手
            $('audio').attr('src', url);  //把url放进audio中的src
            $('audio').attr('sid', sid);  //把sid放进audio中的sid 为歌词参数
            $('audio').attr('ssid', ssid);  //把ssid放进audio中的ssid 为歌词参数
            $('.songName').text(title);   //把歌名title放到songName中
            $('.songName').attr('title', title);
            $('.singer').text(singer);
            $('.singer').attr('singer', singer);
            // $('.background').attr('background', bgPic);
            $('.background').css({
                'background':'url('+bgPic+')',
                'background-repeat': 'no-repeat',
                'background-position': 'center',
                'background-size': 'cover'
            });
            // console.log(songObj);
            play();    //播放
            getLyric();//获取歌词
            }
        })
    }

    //获取歌词
    function getLyric() {
        var Sid = $('audio').attr('sid');
        var Ssid = $('audio').attr('ssid');
        $.post('http://api.jirengu.com/fm/getLyric.php', {ssid: Ssid, sid: Sid})
            .done(function (lyr) {
                // console.log(lyr);
                var lyr = JSON.parse(lyr);  //将json字符串转成json对象
                // console.log(lyr.lyric);

                if (!!lyr.lyric) {
                    $('.music-lyric .lyric').empty();// 清空歌词
                    var line = lyr.lyric.split('\n');//歌词以排数的数组
                    // console.log(line);
                    var timeReg = /\[\d{2}:\d{2}.\d{2}\]/g;//时间的模板
                    // console.log(timeReg);
                    var result = [];
                    if (line != "") {
                        for (var i in line) {
                            var time = line[i].match(timeReg);//每组匹配模板，得到时间数组
                            if (!time) continue;//如果没有，就跳过继续
                            var value = line[i].replace(timeReg, "");//纯歌词
                            for (j in time) {
                                var t = time[j].slice(1, -1).split(':');//分析时间格式，分钟和毫秒是t[0],t[1]
                                var timeArr = parseInt(t[0], 10) * 60 + parseFloat(t[1]);//计算以s为单位的时间
                                result.push([timeArr, value]);
                            }
                        }
                    }
                    // console.log(result);
                    //时间数组排序
                    result.sort(function (a, b) {
                        return a[0] - b[0];

                    });
                    lyricArr = result;
                    // console.log(lyricArr);
                    renderLyric();//渲染歌词

                }
            }).fail(function () {
                $('.music-lyric .lyric').html("<li>本歌曲展示没有歌词</li>");

        })
    }
    function renderLyric() {
        var lyrLi = "";
        for (var i = 0; i < lyricArr.length; i++) {
            lyrLi += "<li data-time='" + lyricArr[i][0] + "'>" + lyricArr[i][1] + "</li>";
        }
        $('.music-lyric .lyric').append(lyrLi); //把lyrLi加到lyric中
        setInterval(showLyric, 100);
    }
    function showLyric() {
        var liH = $(".lyric li").eq(5).outerHeight() - 3;//每行高度
        for (var i = 0; i < lyricArr.length; i++) {
            var curT = $(".lyric li").eq(i).attr("data-time");//获取当前li存入的当前一排歌词时间
            var nexT = $(".lyric li ").eq(i+1).attr("data-time");
            var curTime = myAudio.currentTime;
            // console.log(curTime);
            if ((curTime > curT) && (curT < nexT)) {
                $(".lyric li").removeClass("active");   //去除当前展示这行歌词的展示属性
                $(".lyric li").eq(i).addClass("active");  //
                $(".music-lyric .lyric").css('top', -liH * (i-2));

            }
        }
    }

    //进度条控制
    setInterval(present,500)
    $(".header-2").mousedown(function(ev){  //拖拽进度条控制进度
        var posX = ev.clientX;
        var targetLeft = $(this).offset().left;
        var percentage = (posX - targetLeft)/280*100;
        myAudio.currentTime = myAudio.duration * percentage/100;
    });
    // console.log(myAudio.currentTime);
    function present(){
        var length = myAudio.currentTime/myAudio.duration*100;
        $('.progressbar').width(length+'%');//设置进度条长度
        if(myAudio.currentTime == myAudio.duration){
            getMusic();
        }
    }

    //icon点击事件
    $('.header-star').on('click',function(){
        $(this).toggleClass('stared');//给header-star添加stared样式
    });

    $('.header-heart').on('click',function(){
        $(this).toggleClass('loved');
    });

    $('.header-xunhuan').on('click',function(){
        $(this).toggleClass('recycleed').toggleClass('colored');
        if ($(this).hasClass('recycleed')) {
            $('audio').attr('loop','loop');
        }
        if($(this).hasClass('colored')){
            $('audio').removeAttr('loop','no-loop');
        }
    });

    $('.header-lrc').on('click',function(){
        $(this).toggleClass('lyriced');
        if ($(this).hasClass('lyriced')) {
            $('.background .music-lyric').css({'display':'block'})
        }else{
            $('.background .music-lyric').css({'display':'none'})
        }
    })
};
