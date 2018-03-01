export interface Config {
    /**
     * @type {string}
     * @default $!h!$!m!$!s!
     */
    template?: string;

    /**
     * @type {('lite' | 'medium' | 'large')}
     * @default lite
     */
    size?: 'lite' | 'medium' | 'large';

    /**
     * 
     * @type {number}
     */
    leftTime?: number;

    /**
     * 
     * @type {number}
     * @memberOf Config
     */
    stopTime?: number;

    /**
     * 
     * @type {RegExp}
     * @default /\$\{([\-\w]+)\}/g
     */
    varRegular?: RegExp;

    /**
     * 
     * @type {any[]}
     * @default ['d', 100, 2, 'h', 24, 2, 'm', 60, 2, 's', 60, 2, 'u', 10, 1]
     */
    clock?: any[];

    /**
     * 
     * @type {number[]}
     */
    notify?: number[];

    /**
     * 
     * @type {string}
     */
    className?: string;

    /**
     */
    repaint?: Function;
}
