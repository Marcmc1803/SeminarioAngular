import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organizacion } from '../models/organizacion.model';
import { Usuario } from '../models/usuario.model';
import { UsuarioService } from '../services/usuario.service';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-organizacion-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organizacion-usuarios.html',
  styleUrls: ['./organizacion-usuarios.css']
})
export class OrganizacionUsuarios implements OnInit {
  @Input() organizacion!: Organizacion;
  @Output() changed = new EventEmitter<void>();

  todosUsuarios: Usuario[] = [];
  usuariosDisponibles: Usuario[] = [];
  selectedUserControl = new FormControl('');
  
  loading = false;
  errorMsg = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (users) => {
        this.todosUsuarios = users;
        // Usuarios que no están en la organización actual
        this.usuariosDisponibles = this.todosUsuarios.filter(u => 
          (typeof u.organizacion === 'string' ? u.organizacion : u.organizacion?._id) !== this.organizacion._id
        );
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Error al cargar usuarios';
        this.loading = false;
      }
    });
  }

  addUsuario() {
    const userId = this.selectedUserControl.value;
    if (!userId) return;
    
    const userToUpdate = this.todosUsuarios.find(u => u._id === userId);
    if (!userToUpdate) return;

    this.loading = true;
    this.usuarioService.updateUsuario(
      userToUpdate._id, 
      userToUpdate.name, 
      userToUpdate.email, 
      userToUpdate.password || '', 
      this.organizacion._id
    ).subscribe({
      next: () => {
        this.changed.emit();
        this.selectedUserControl.reset('');
        this.loadUsers();
      },
      error: () => {
        this.errorMsg = 'Error al añadir usuario a la organización';
        this.loading = false;
      }
    });
  }

  removeUsuario(user: Usuario) {
    this.loading = true;
    this.usuarioService.updateUsuario(
      user._id, 
      user.name, 
      user.email, 
      user.password || '', 
      '' // string vacio para quitar org
    ).subscribe({
      next: () => {
        this.changed.emit();
        this.loadUsers();
      },
      error: () => {
        this.errorMsg = 'Error al eliminar usuario de la organización';
        this.loading = false;
      }
    });
  }
}
