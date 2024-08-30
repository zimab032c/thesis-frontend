import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default {
  install: (app) => {
    app.config.globalProperties.$progress = NProgress;
  }
};
