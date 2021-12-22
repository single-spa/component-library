import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import {
  RouteTreeItem,
  RouteTree,
  RouteTreeItemType,
  Route,
  Routes,
} from "./Routes";

/**
 * Renders sidenav tree based on route information.
 *
 * Note: Subtree expansion state will be lost on re-render, consider storing it internally
 */
@customElement("design-docs-sidenav")
export class SideNavElement extends LitElement {
  /**
   * Flat array of routes
   */
  @property({ attribute: false, type: Array })
  routes: Routes = [];

  /**
   * Tree-structured array of routes, will ideally be generated by this component,
   * or possibly higher up to support title changes, TBD
   */
  @property({ attribute: false, type: Array })
  routeTree: RouteTree = [];

  @property({ attribute: true, type: Boolean })
  searchable = false;

  /** Active search string */
  @state() searchString = "";

  static styles = css`
    :host {
      font-family: var(--dd-sidenav-font);
    }
    ul {
      margin-block-start: var(--dd-sidenav-item-spacing, 0.25em);
      margin-block-end: var(--dd-sidenav-item-spacing, 0.25em);
    }
    li:not(:first-child) {
      margin-top: var(--dd-sidenav-item-spacing, 0.25em);
    }
    li:not(:last-child) {
      margin-bottom: var(--dd-sidenav-item-spacing, 0.25em);
    }
    .hidden {
      display: none;
    }
    ul[role="group"] {
      padding-inline-start: var(--dd-sidenav-group-indent, 1.25em);
    }
    li[aria-expanded="false"].expandable > ul {
      display: none;
    }
    .group-label {
      cursor: pointer;
    }
    a {
      text-decoration: none;
      color: black;
    }
  `;

  render() {
    const searchClasses = { hidden: !this.searchable };
    return html` <design-docs-sidenav-search
        @search=${this.onSearch}
        class=${classMap(searchClasses)}
      ></design-docs-sidenav-search>
      <nav>
        <ul role="tree">
          ${this.routeTree.map((item) => this.renderTreeItem(item))}
        </ul>
      </nav>`;
  }

  renderTreeItem(treeItem: RouteTreeItem) {
    if (treeItem.type === RouteTreeItemType.GROUP) {
      return html`<li role="treeitem" class="expandable" aria-expanded="false">
        <span
          class="group-label"
          tabindex="0"
          @click="${this.onTreeGroupClick}"
          @keydown="${this.onTreeGroupKeyDown}"
          >${treeItem.label}</span
        >
        <ul role="group">
          ${treeItem.children?.map((item) => this.renderTreeItem(item))}
        </ul>
      </li> `;
    } else {
      const route: Route = this.routes[treeItem.index];
      if (this.itemHiddenForSearch(route)) {
        // Hide if outside search
        return null;
      }
      return html`<li role="treeitem">
        <a href="${route.path}">${route.label}</a>
      </li>`;
    }
  }

  private itemHiddenForSearch(route: Route): boolean {
    if (this.searchable && this.searchString) {
      return !route.label?.includes(this.searchString);
    }
    return false;
  }

  private onSearch(event: SideNavSearchSearchEvent): void {
    console.info("Search happened!", event.detail);
    this.searchString = event.detail;
  }

  private onTreeGroupKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      const el = (event.target as HTMLSpanElement).parentElement;
      this.treeGroupToggle(el);
    }
  }

  private onTreeGroupClick(event: PointerEvent): void {
    const el = (event.target as HTMLSpanElement).parentElement;
    this.treeGroupToggle(el);
  }

  private treeGroupToggle(el: HTMLElement | null): void {
    if (el && el?.ariaExpanded === "true") {
      el.ariaExpanded = "false";
    } else {
      el?.setAttribute("aria-expanded", "true");
    }
  }
}

/**
 * Basic sidenav header with search
 */
@customElement("design-docs-sidenav-search")
export class SideNavSearchElement extends LitElement {
  /** Search input placeholder text */
  @property() placeholder = "Search";

  static styles = css`
    :host {
      font-family: var(--dd-sidenav-font);
      display: flex;
      padding: var(--dd-sidenav-item-spacing, 0.25em);
      background-color: var(--dd-sidenav-accent-color, silver);
    }
    input {
      flex: 1;
    }
  `;

  render() {
    return html`<input
      type="search"
      placeholder="${this.placeholder}"
      @input=${this.onSearchChange}
    />`;
  }

  private onSearchChange(event: InputEvent): void {
    this.dispatchEvent(
      new CustomEvent("search", {
        detail: (event.target as HTMLInputElement).value,
        composed: true,
      })
    );
  }
}

export type SideNavSearchSearchEvent = CustomEvent<string>;
