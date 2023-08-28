export const DefaultPublishTpl = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

    <meta name="xr-meta-title" content="{{ ctx.title }}">
    <meta name="xr-meta-snapshot" content="{{ ctx.poster }}">

    <script>
      window.__startTimestamp = performance.now();
    </script>

    <title>{{ ctx.title }}</title>

    <style>
      html,body {
        margin: 0;
        padding: 0;
        font-family: Chinese Quote, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, Helvetica, Arial, sans-serif;
      }
      
      #__container {
        position: relative;
        width: 100vw;
        height: 100vh;
        -webkit-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      #__loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999999;

        background: #fff;
        opacity: 1;

        transition: opacity 0.4s;
      }

      #__loading > .bg {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(10px);
      }

      #__loading > .spinner {
        position: absolute;
        top: calc(50% - 28px);
        left: calc(50% - 28px);
      }

      #__loading > .logo {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .spinner {
        position: relative;
        width: 56px;
        height: 56px;
        border: 3px solid #1668dc;
        border-top-color: rgba(0, 0, 0, 0.2);
        border-right-color: rgba(0, 0, 0, 0.2);
        border-bottom-color: rgba(0, 0, 0, 0.2);
        border-radius: 100%;
        box-sizing: border-box;
        animation: circle infinite 0.75s linear;
      }

      @keyframes circle {
        0% {
          transform: rotate(0);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .logo {
        display: block;
        width: 40px;
        height: 40px;
        border-radius: 100%;
        overflow: hidden;
        object-fit: contain;
        box-sizing: border-box;
      }
      
    </style>
   
  </head>
  <body>
    
    <div id='__container'>
    </div>

    <div id='__loading'>
      {% if ctx.backgroundImage or ctx.poster %}
      <img class='bg' src="{{ ctx.backgroundImage if ctx.backgroundImage else ctx.poster }}" />
      {% endif %}

      <div class='spinner'></div>

      {% if ctx.logo %}
      <img class='logo' src="{{ ctx.logo }}" />
      {% endif %}
    </div>
    
    <script crossorigin="anonymous" src="{{ctx.entryJsURL}}"></script>

    <script>
      const urlParams = new URLSearchParams(location.search);

      const opt = {
        container: '__container',
        mfs: { url: '{{ ctx.mfsURL }}', indexKey: '{{ ctx.mfsFileIndexKey }}' }
      };

      XR.XRRuntimeStartup.start(opt).then(rt => {
        window.__xr = rt;

        rt.event.listen('scene:afterLoaded', () => {
          // hide logo
          const _loadingEle = document.getElementById('__loading');
          _loadingEle.style.opacity = '0';

          setTimeout(() => {
            _loadingEle.style.display = 'none';
          }, 400);
        });
      });
    </script>
  </body>
</html>
`;
