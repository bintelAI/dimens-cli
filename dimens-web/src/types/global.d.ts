import type { DimensWebHostProps } from './micro-module';

declare global {
  interface Window {
    __POWERED_BY_WUJIE__?: boolean;
    __WUJIE_MOUNT?: () => void;
    __WUJIE_UNMOUNT?: () => void;
    __DIMENS_WEB_HOST_PROPS__?: DimensWebHostProps;
    $wujie?: {
      props?: DimensWebHostProps;
      bus?: {
        $emit?: (event: string, payload?: unknown) => void;
        $on?: (event: string, handler: (payload?: unknown) => void) => void;
        $off?: (event: string, handler: (payload?: unknown) => void) => void;
      };
    };
  }
}

export {};
