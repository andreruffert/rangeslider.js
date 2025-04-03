declare namespace Rangeslider {
    export interface Options {
        polyfill?: boolean;
        rangeClass?: string;
        disabledClass?: string;
        horizontalClass?: string;
        verticalClass?: string;
        fillClass?: string;
        handleClass?: string;
        onInit?: () => void;
        onSlide?: (position: number, value: number) => void;
        onSlideEnd?: (position: number, value: number) => void;
    }
}

interface JQuery {
    rangeslider(): JQuery;
    rangeslider(action: "destroy"): JQuery;
    rangeslider(action: "update", updateAttributes?: boolean): JQuery;
    rangeslider(options: Rangeslider.Options): JQuery;
}
