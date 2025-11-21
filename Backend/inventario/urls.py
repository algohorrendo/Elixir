from django.urls import path
from . import views

app_name = 'inventario'

urlpatterns = [
    # API endpoints
    path('home/', views.home, name='api_home'),
    path('catalogo/', views.catalogo, name='api_catalogo'),
    path('producto/<int:producto_id>/', views.detalle_producto, name='api_detalle_producto'),
    path('checkout/', views.checkout, name='api_checkout'),
    path('productos/', views.api_productos, name='api_productos'),
    path('productos', views.api_productos, name='api_productos_root'),
    path('registro/', views.registro_cliente, name='api_registro_cliente'),
    path('login/', views.login_cliente, name='api_login_cliente'),
    
    # Endpoints de gestión de roles
    path('cambiar-rol/', views.cambiar_rol_cliente, name='api_cambiar_rol'),
    path('verificar-rol/', views.verificar_rol, name='api_verificar_rol'),
    path('listar-clientes/', views.listar_clientes, name='api_listar_clientes'),
    
    # Endpoints para pedidos y checkout
    path('crear-pedido/', views.crear_pedido, name='api_crear_pedido'),
    path('mis-pedidos/', views.mis_pedidos, name='api_mis_pedidos'),
    path('dashboard-gerente/', views.dashboard_gerente, name='api_dashboard_gerente'),
    path('mi-perfil/', views.mi_perfil, name='api_mi_perfil'),
    path('marcar-pagado/', views.marcar_pedido_pagado, name='api_marcar_pagado'),
    
    # Endpoints para edición de productos y sliders
    path('productos/<int:producto_id>/actualizar/', views.actualizar_producto, name='api_actualizar_producto'),
    path('sliders/', views.obtener_sliders, name='api_sliders'),
    
    # Legacy URLs (redirect to home)
    path('', views.home, name='index'),
]
