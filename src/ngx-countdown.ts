import { Component, ElementRef, ViewEncapsulation, Input, Renderer2, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter, HostBinding } from '@angular/core';
import { Config } from './interfaces/config';
import { Hand } from './interfaces/hand';
import { Timer } from './timer';

@Component({
    selector: 'countdown',
    template: `<ng-content></ng-content>`,
    host: {
        '[class]': 'cls'
    },
    styleUrls: ['./ngx-countdown.css'],
    encapsulation: ViewEncapsulation.None
})
export class CountdownComponent implements OnChanges, OnDestroy {

    @Input() config: Config;
    @Output() start = new EventEmitter();
    @Output() finished = new EventEmitter();
    @Output() notify = new EventEmitter();
    @Input() negative: boolean = false;
    @Output() negativeChange: EventEmitter<boolean> = new EventEmitter();
    cls: string;

    constructor(private el: ElementRef,
        private Renderer2: Renderer2,
        private timer: Timer) {
        this.timer.start();
    }

    ngOnInit() {
        this.init();
    }

    ngOnDestroy(): void {
        this.destroy();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.config != undefined)
            if (!changes.config.firstChange) {
                this.destroy().init();
            }
    }

    restart(): void {
        this.destroy().init();
        this.timer.start();
    }

    private frequency: number = 1000;
    private _notify: any = {};
    private hands: Hand[] = [];
    private left: number = 0;

    private init() {
        const me = this;
        const el = me.el.nativeElement;

        me.config = Object.assign(<Config>{
            leftTime: 0,
            template: '$!h! $!m! $!s!',
            size: 'lite',
            effect: 'normal',
            varRegular: /\$\!([\-\w]+)\!/g,
            clock: ['d', 100, 2, 'h', 24, 2, 'm', 60, 2, 's', 60, 2, 'u', 10, 1]
        }, me.config);

        this.cls = `count-down ${me.config.size} ${me.config.className}`;

        // markup
        let tmpl = el.innerHTML || me.config.template;
        me.config.varRegular.lastIndex = 0;
        el.innerHTML = tmpl.replace(me.config.varRegular, (str: string, type: string) => {
            // .
            if (type === 'u' || type === 's-ext')
                me.frequency = 100;

            // hand markup
            let content = '';
            if (type === 's-ext') {
                me.hands.push({ type: 's' });
                me.hands.push({ type: 'u' });
                content = me.html('', 's', 'handlet') +
                    me.html('.', '', 'digital') +
                    me.html('', 'u', 'handlet');
            } else {
                me.hands.push({ type: type });
            }

            return me.html(content, type, 'hand');
        });

        const clock = me.config.clock;
        me.hands.forEach((hand: Hand) => {
            let type = hand.type,
                base: number = 100,
                i: number;

            hand.node = el.querySelector(`.hand-${type}`);
            // radix, bits 
            for (i = clock.length - 3; i > -1; i -= 3) {
                if (type === clock[i]) {
                    break;
                }

                base *= clock[i + 1];
            }
            hand.base = base;
            hand.radix = clock[i + 1];
            hand.bits = clock[i + 2];
        });

        me.getLeft();
        me.reflow();

        // bind reflow to me
        const _reflow = me.reflow;
        me.reflow = (count: number = 0) => {
            return _reflow.apply(me, [count]);
        };

        //  notify
        if (me.config.notify) {
            me.config.notify.forEach((time: number) => {
                if (time < 1) throw new Error('finished，notify');
                time = time * 1000;
                time = time - time % me.frequency;
                me._notify[time] = true;
            });
        }

        me.start.emit();
        me.timer.add(me.reflow, me.frequency);
        // show
        el.style.display = 'inline';

        return me;
    }

    private destroy() {
        this.timer.remove(this.reflow);
        return this;
    }

    private reflow(count: number = 0): void {
        const me = this;

        this.valid(me.left);

        if (me.left < 0) {
            me.left *= -1;
            this.negative = true;
            this.negativeChange.emit(true);
        }

        if (this.negative)
            me.left = me.left + me.frequency * count;
        else
            me.left = me.left - me.frequency * count;


        me.hands.forEach((hand: Hand) => {
            hand.lastValue = hand.value;
            hand.value = Math.floor(me.left / hand.base) % hand.radix;
        });

        me.repaint();

        if (me._notify[me.left]) {
            me.notify.emit(me.left);
        }

        if (me.left < 1) {
            me.finished.emit(0);
            this.destroy();
        }
    }

    private repaint(): void {
        let me = this;
        if (me.config.repaint) {
            me.config.repaint.apply(me);
            return;
        }

        let content: string;

        me.hands.forEach((hand: Hand) => {
            if (hand.lastValue !== hand.value) {
                content = '';

                me.toDigitals(hand.value, hand.bits).forEach((digital: number) => {
                    content += me.html(digital.toString(), '', 'digital');
                });

                hand.node.innerHTML = content;
            }
        });
    }

    private getLeft(): void {
        let left: number = this.config.leftTime * 1000,
            end: number = this.config.stopTime;

        if (!left && end)
            left = end - new Date().getTime();

        this.left = left - left % this.frequency;
    }

    private html(con: string | any[], className: string, type: string): string {
        if (con instanceof Array) {
            con = con.join('');
        }

        if (this.negative) {
            //className += ' negative ';
        }

        switch (type) {
            case 'hand':
            case 'handlet':
                className = type + ' hand-' + className;
                break;
            case 'digital':
                if (con === '.') {
                    className = type + ' ' + type + '-point ' + className;
                } else {
                    className = type + ' ' + type + '-' + con + ' ' + className;
                }
                break;
        }
        return '<span class="' + className + '">' + con + '</span>';
    }

    private toDigitals(value: number, bits: number): number[] {
        value = value < 0 ? 0 : value;
        let digitals = [];

        while (bits--) {
            digitals[bits] = value % 10;
            value = Math.floor(value / 10);
        }
        return digitals;
    }

    private valid(value) {
        if (value <= 1000) {
            this.negative = true;
            this.negativeChange.emit(true);
        }
    }

}
