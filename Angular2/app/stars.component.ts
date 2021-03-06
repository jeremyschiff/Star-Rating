import {Component, ElementRef} from '@angular/core';

@Component({
    selector: 'stars',
    styles: [`
        .stars {
            display: inline-block;
            position: relative;
            z-index: 0;
        }

        .stars-selected {
            position: absolute;
            max-width: 100%;
            height: 100%;
            z-index: -1;
        }
    `],
    template: `
        <div class="stars" 
            [ngStyle]="{'background-color': starBackColor}"
            (click)="secureNewRating()"
            (mouseleave)="leaveRating()"
            (mousemove)="changeRating($event)">
            <div class="stars-selected" 
                [ngStyle]="{'width': selectedWidth, 'background-color': selectedColor}"></div>
            <star-item *ngFor="let i of itemsIterable" [type]="type" [backColor]="backColor" [radius]="radius"></star-item>
        </div>
    `
})

export class StarComponent {
    radius: number;
    type: string;
    items: number;
    itemsIterable: number[];
    selectedColor: string;
    backColor: string;
    starBackColor: string;
    securedWidth: string;
    selectedWidth: string;
    percent: string;
    starsSelected: number;
    disabled: boolean;
    el: ElementRef;
    elDimensions: ClientRect;

    constructor(el: ElementRef) {
        const nativeEl = el.nativeElement;
        const getAttr = (nEl: HTMLElement, attr: string, def?: string) :string => nEl.getAttribute(attr) || def;

        // Pass attributes into app
        this.selectedColor = getAttr(nativeEl, 'sel-color', 'gold');
        this.backColor = getAttr(nativeEl, 'back-color', 'white');
        this.starBackColor = getAttr(nativeEl, 'star-back-color', 'lightgray');
        this.radius = parseInt(getAttr(nativeEl, 'radius', '30'), 10);
        this.items = parseInt(getAttr(nativeEl, 'items', '5'), 10);
        this.percent = getAttr(nativeEl, 'percent', '0') + '%';
        this.starsSelected = parseFloat(getAttr(nativeEl, 'stars-selected', '0'));
        this.disabled = !!getAttr(nativeEl, 'disabled');
        this.type = getAttr(nativeEl, 'type', 'star');

        this.itemsIterable = new Array(this.items);
        this.securedWidth = this.starsSelected ? 100 / this.items * this.starsSelected + '%' : this.percent;
        this.elDimensions = nativeEl.getBoundingClientRect();
        this.el = el;

        // initial rating setup
        this.selectedWidth = this.securedWidth;
    }

    changeRating(e: MouseEvent) {
        this.selectedWidth = !this.disabled && e.clientX - this.elDimensions.left + 'px';
        this.percent = parseInt(this.selectedWidth, 10) / this.radius * 2 * this.items + '%';
    }

    leaveRating() {
        this.selectedWidth = this.securedWidth;
    }

    secureNewRating() {
        this.securedWidth = this.percent;
    }
}
