import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProductos } from '../api';
import { useRol } from '../contexts/RolContext';
import "../styles/globals.css";

function CatalogoPorCategoria() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { usuario } = useRol();
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem('carrito');
    return saved ? JSON.parse(saved) : [];
  });
  const [editando, setEditando] = useState(false);
  const [productoEditado, setProductoEditado] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        setLoading(true);
        const data = await fetchProductos();
        setProductos(data.productos || []);
        
        // Extraer categorías únicas
        const cats = [...new Set(data.productos.map(p => p.categoria?.nombre))];
        setCategorias(cats.sort());
        
        // Seleccionar la primera categoría por defecto
        if (cats.length > 0) {
          setCategoriaSeleccionada(cats[0]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error al obtener productos:', err);
        setError('No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    obtenerProductos();
  }, []);

  const agregarAlCarrito = (producto) => {
    const productoExistente = carrito.find(p => p.id === producto.id);
    
    let nuevoCarrito;
    if (productoExistente) {
      nuevoCarrito = carrito.map(p =>
        p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
      );
    } else {
      nuevoCarrito = [...carrito, { ...producto, cantidad: 1 }];
    }
    
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    alert(`${producto.nombre} agregado al carrito`);
  };

  const handleEditarProducto = (producto) => {
    if (usuario?.rol !== 'vendedor' && usuario?.rol !== 'admin_sistema') return;
    setEditando(true);
    setProductoEditado(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      imagen_url: producto.imagen_url || ''
    });
  };

  const handleGuardarProducto = async () => {
    if (!formData.nombre || !formData.precio) {
      alert('Completa los campos obligatorios (nombre, precio)');
      return;
    }
    
    try {
      // Obtener usuario del localStorage
      const usuarioJson = localStorage.getItem('usuario');
      const usuario = usuarioJson ? JSON.parse(usuarioJson) : null;
      
      // Preparar datos para enviar
      const datosActualizacion = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: formData.precio,
        stock: formData.stock,
        imagen_url: formData.imagen_url,
        usuario_id: usuario?.id
      };
      
      // Enviar al backend
      const response = await fetch(
        `http://localhost:8000/api/productos/${productoEditado.id}/actualizar/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosActualizacion)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el producto en la lista local
        const productosActualizados = productos.map(p =>
          p.id === productoEditado.id ? { ...p, ...formData } : p
        );
        setProductos(productosActualizados);
        setEditando(false);
        setProductoEditado(null);
        alert('Producto actualizado correctamente en la base de datos');
      } else {
        alert(`Error: ${data.message || 'No se pudo actualizar el producto'}`);
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al guardar en la base de datos: ' + error.message);
    }
  };

  const productosPorCategoria = productos.filter(
    p => p.categoria?.nombre === categoriaSeleccionada
  );

  const getIconoCategoria = (categoria) => {
    const iconos = {
      'Vinos': 'fas fa-wine-glass-alt',
      'Cervezas': 'fas fa-beer',
      'Piscos': 'fas fa-glass-whiskey',
      'Whiskys': 'fas fa-glass-whiskey',
      'Ron': 'fas fa-glass-whiskey'
    };
    return iconos[categoria] || 'fas fa-bottle-water';
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: 'var(--light-bg)' }}>
      {/* Modal de edición */}
      {editando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '95%',
            boxShadow: 'var(--shadow-lg)',
            margin: '20px auto'
          }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>Editar Producto</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Nombre del Producto:</label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Descripción:</label>
              <textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Precio:</label>
                <input
                  type="number"
                  value={formData.precio || ''}
                  onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value)})}
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Stock:</label>
                <input
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--primary-color)' }}>URL de Imagen:</label>
              <input
                type="text"
                value={formData.imagen_url || ''}
                onChange={(e) => setFormData({...formData, imagen_url: e.target.value})}
                placeholder="https://ejemplo.com/imagen.jpg"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditando(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--muted-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarProducto}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--secondary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <h1 className="fw-bold mb-5 text-center" style={{ color: 'var(--primary-color)' }}>
          <i className="fas fa-shop"></i> Catálogo de Licores
        </h1>

        {/* Categorías */}
        <div className="row mb-5">
          <div className="col-12">
            <h5 className="fw-bold mb-3">Selecciona una categoría:</h5>
            <div className="d-flex flex-wrap gap-2">
              {categorias.map(categoria => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaSeleccionada(categoria)}
                  className="btn"
                  style={{
                    backgroundColor: categoriaSeleccionada === categoria ? 'var(--secondary-color)' : 'white',
                    color: categoriaSeleccionada === categoria ? 'white' : 'var(--primary-color)',
                    border: `2px solid ${categoriaSeleccionada === categoria ? 'var(--secondary-color)' : 'var(--border-color)'}`
                  }}
                >
                  <i className={getIconoCategoria(categoria)}></i> {categoria}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categoría activa */}
        {categoriaSeleccionada && (
          <div>
            <div className="mb-4">
              <h3 className="fw-bold" style={{ color: 'var(--primary-color)' }}>
                <i className={getIconoCategoria(categoriaSeleccionada)}></i> {categoriaSeleccionada}
              </h3>
              <p className="text-muted">
                Mostrando {productosPorCategoria.length} producto{productosPorCategoria.length !== 1 ? 's' : ''}
              </p>
            </div>

            {productosPorCategoria.length === 0 ? (
              <div className="alert alert-info">
                No hay productos en esta categoría
              </div>
            ) : (
              <div className="row g-4">
                {productosPorCategoria.map(producto => (
                  <div key={producto.id} className="col-lg-3 col-md-4 col-sm-6">
                    <div
                      className="card h-100 shadow-sm"
                      style={{
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        border: `2px solid var(--border-color)`,
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden', height: '250px' }}>
                        <img
                          src={producto.imagen_url || producto.imagen}
                          alt={producto.nombre}
                          style={{ height: '100%', objectFit: 'cover', width: '100%' }}
                          className="card-img-top"
                        />
                        {producto.stock <= 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span className="text-white fw-bold">AGOTADO</span>
                          </div>
                        )}
                        {(usuario?.rol === 'vendedor' || usuario?.rol === 'admin_sistema') && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                          onClick={() => handleEditarProducto(producto)}
                          title="Editar producto"
                          >
                            <i className="fas fa-edit"></i>
                          </div>
                        )}
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title" style={{ color: 'var(--primary-color)' }}>{producto.nombre}</h5>
                        <p className="card-text text-muted small">
                          {producto.descripcion?.substring(0, 80)}...
                        </p>
                        <div className="mb-3">
                          {producto.stock > 0 ? (
                            <span className="badge" style={{ backgroundColor: 'var(--success-color)' }}>Stock: {producto.stock}</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'var(--danger-color)' }}>Agotado</span>
                          )}
                        </div>
                        <p className="fw-bold fs-5 mb-3" style={{ color: 'var(--secondary-color)' }}>
                          ${producto.precio ? producto.precio.toLocaleString('es-CL') : '0'}
                        </p>
                        <div className="gap-2 d-flex mt-auto">
                          <button
                            className="btn btn-sm flex-grow-1"
                            style={{
                              color: 'var(--primary-color)',
                              border: `2px solid var(--primary-color)`,
                              backgroundColor: 'white'
                            }}
                            onClick={() => navigate(`/producto/${producto.id}`)}
                          >
                            Ver Detalle
                          </button>
                          <button
                            className="btn btn-sm flex-grow-1"
                            style={{
                              backgroundColor: 'var(--secondary-color)',
                              color: 'white',
                              border: 'none'
                            }}
                            onClick={() => agregarAlCarrito(producto)}
                            disabled={producto.stock <= 0}
                          >
                            <i className="fas fa-cart-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CatalogoPorCategoria;
