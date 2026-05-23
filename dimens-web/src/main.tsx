import './index.css';
import { mount, render, unmount, update, bootstrap } from '@/micro-app/lifecycle';

if (window.__POWERED_BY_WUJIE__) {
  window.__WUJIE_MOUNT = () => {
    void mount(window.$wujie?.props || {});
  };
  window.__WUJIE_UNMOUNT = () => {
    void unmount();
  };
} else {
  render();
}

export { bootstrap, mount, update, unmount };
