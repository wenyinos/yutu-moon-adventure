// 小红书端能力适配层：能力检测 + 降级
(function () {
  var YT = (window.YT = window.YT || {});

  function miniTool() {
    var ok = window.xhs && window.xhs.miniTool;
    return ok ? window.xhs.miniTool : null;
  }

  function available() { return !!miniTool(); }

  function canvasToDataUrl(canvas) {
    // JPEG 体积小，分享卡无透明需求
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  // 统一处理容器回调：兼容 Promise 返回与 callback 风格
  function callApi(fn, onDone, onFail) {
    var res = null;
    try { res = fn(); } catch (e) { onFail(e); return; }
    if (res && typeof res.then === "function") {
      res.then(onDone, onFail);
    } else {
      onDone(res);
    }
  }

  function extractFilePath(res) {
    if (!res) return null;
    return res.filePath || res.tempFilePath || (res.data && res.data.filePath) || null;
  }

  YT.XHS = {
    available: available,

    // 保存分享卡到相册；无端能力时降级为浏览器下载
    saveImage: function (canvas, onOk, onFail) {
      var dataUrl = canvasToDataUrl(canvas);
      var mt = miniTool();
      if (mt && typeof mt.saveImageToPhotosAlbum === "function") {
        callApi(
          function () { return mt.saveImageToPhotosAlbum({ filePath: dataUrl }); },
          function (res) { onOk(res); },
          function (e) {
            // 部分机型大图失败，改走临时文件
            if (mt && typeof mt.writeTempFile === "function") {
              callApi(
                function () { return mt.writeTempFile({ data: dataUrl }); },
                function (res2) {
                  var fp = extractFilePath(res2);
                  if (!fp) { onFail(new Error("writeTempFile 无返回路径")); return; }
                  callApi(
                    function () { return mt.saveImageToPhotosAlbum({ filePath: fp }); },
                    onOk,
                    onFail
                  );
                },
                onFail
              );
            } else {
              onFail(e);
            }
          }
        );
      } else {
        downloadFallback(dataUrl, onOk, onFail);
      }
    },

    // 发布笔记：大图先 writeTempFile 换本地路径，再 postNote
    publish: function (canvas, meta, onOk, onFail) {
      var mt = miniTool();
      if (!mt || typeof mt.postNote !== "function") {
        onFail(new Error("当前环境不支持发布笔记"));
        return;
      }
      var dataUrl = canvasToDataUrl(canvas);

      var doPublish = function (filePath) {
        callApi(
          function () {
            return mt.postNote({
              title: meta.title,
              content: meta.content,
              tags: meta.tags,
              mediaInfo: { image_resources: [{ url: filePath }] }
            });
          },
          onOk,
          onFail
        );
      };

      if (typeof mt.writeTempFile === "function") {
        callApi(
          function () { return mt.writeTempFile({ data: dataUrl }); },
          function (res) {
            var fp = extractFilePath(res);
            if (fp) doPublish(fp);
            else doPublish(dataUrl); // 容错：退回 dataUrl
          },
          function () { doPublish(dataUrl); }
        );
      } else {
        doPublish(dataUrl);
      }
    }
  };

  function downloadFallback(dataUrl, onOk, onFail) {
    try {
      var a = document.createElement("a");
      a.href = dataUrl;
      a.download = "yutu_moon_result.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onOk(null);
    } catch (e) {
      onFail(e);
    }
  }
})();
