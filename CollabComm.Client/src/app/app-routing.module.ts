import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from './pages/login/login.component';

const routes: Routes = [




  // {path: 'maintenance', component: MaintenancePageComponent},
  // {path: '404', resolve: {path: PathResolveService}, component: NotFoundComponent},
  // {path: '**', redirectTo: '/404'},

  {path: '', loadChildren: () => import('./pages/chat-page/chat-page.module').then(m => m.ChatPageModule)},
  {path: 'auth/login', component: LoginComponent},
  {path: 'auth/login/:id', component: LoginComponent},


];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes)],
})
export class AppRoutingModule {
}
