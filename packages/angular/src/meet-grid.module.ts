import { NgModule } from '@angular/core'
import { MeetGridItemDirective, MeetGridContainerDirective } from './directives'
import { MeetGridService } from './meet-grid.service'

/**
 * Angular module for meet-layout-grid.
 * Import this module in your app to use the grid directives and service.
 *
 * @example
 * ```typescript
 * import { MeetGridModule } from '@meet-layout-grid/angular'
 *
 * @NgModule({
 *   imports: [MeetGridModule],
 *   // ...
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({
    imports: [MeetGridItemDirective, MeetGridContainerDirective],
    exports: [MeetGridItemDirective, MeetGridContainerDirective],
    providers: [MeetGridService],
})
export class MeetGridModule { }
