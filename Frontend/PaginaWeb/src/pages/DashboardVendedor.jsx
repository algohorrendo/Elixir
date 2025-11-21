import React, { useState, useEffect } from "react";
import { useRol } from "../contexts/RolContext";
import "../styles/globals.css";
import { FaBox, FaChartBar, FaDollarSign, FaShoppingCart, FaUserTie, FaArrowUp, FaPlus, FaEdit, FaTrash, FaImage, FaUpload, FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";

function DashboardVendedor() {
  const { usuario } = useRol();
  const [metricas, setMetricas] = useState({
    productosActivos: 0,
    ventasHoy: 0,
    ingresoMes: 0,
    ordenesPendientes: 0,
    tasaConversion: 0,
    stockBajo: 0,
  });
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [showFormProducto, setShowFormProducto] = useState(false);
  const [showAjusteStock, setShowAjusteStock] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [nuevoStock, setNuevoStock] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    imagen: null,
    sku: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Obtener productos reales de la botillería
      const productosResponse = await fetch("http://localhost:8000/api/productos/");
      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        const listaProductos = productosData.productos || productosData || [];
        
        setProductos(listaProductos);

        // Calcular métricas basadas en productos reales
        const productosActivos = listaProductos.filter(p => p.activo !== false).length;
        const stockBajo = listaProductos.filter(p => p.stock < p.stock_minimo).length;
        const ingresoMes = listaProductos.reduce((sum, p) => {
          const ganancia = (p.precio - p.costo) * (p.stock > 0 ? Math.min(p.stock, 10) : 0);
          return sum + ganancia;
        }, 0);

        setMetricas({
          productosActivos,
          ventasHoy: Math.floor(Math.random() * 20),
          ingresoMes,
          ordenesPendientes: Math.floor(Math.random() * 10),
          tasaConversion: (Math.random() * 5 + 2).toFixed(1),
          stockBajo,
        });

        // Generar ventas recientes simuladas basadas en productos reales
        const ventasRecientesData = listaProductos.slice(0, 5).map((producto, idx) => ({
          id: idx + 1,
          cliente: `Cliente ${idx + 1}`,
          producto: producto.nombre,
          cantidad: Math.floor(Math.random() * 3) + 1,
          monto: (producto.precio * (Math.floor(Math.random() * 3) + 1)),
          fecha: new Date(Date.now() - (idx + 1) * 60 * 60 * 1000),
          estado: ["completado", "enviando", "pendiente"][Math.floor(Math.random() * 3)],
        }));
        setVentasRecientes(ventasRecientesData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imagen: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('nombre', formData.nombre);
    form.append('descripcion', formData.descripcion);
    form.append('precio', formData.precio);
    form.append('stock', formData.stock);
    form.append('categoria', formData.categoria);
    form.append('sku', formData.sku);
    if (formData.imagen) form.append('imagen', formData.imagen);

    try {
      const response = await fetch('http://localhost:8000/api/productos/crear/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: form
      });

      if (response.ok) {
        alert('✅ Producto creado exitosamente');
        setFormData({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen: null, sku: '' });
        setPreviewImage(null);
        setShowFormProducto(false);
        cargarDatos();
      } else {
        const error = await response.json();
        alert('❌ Error: ' + (error.detail || 'No se pudo crear el producto'));
      }
    } catch (error) {
      console.error('Error creando producto:', error);
      alert('❌ Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAjusteStock = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/productos/${selectedProducto.id}/actualizar-stock/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nuevo_stock: nuevoStock })
      });

      if (response.ok) {
        alert('✅ Stock actualizado correctamente');
        setShowAjusteStock(false);
        cargarDatos();
      } else {
        alert('❌ Error al actualizar stock');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar stock');
    }
  };

  const abrirAjusteStock = (producto) => {
    setSelectedProducto(producto);
    setNuevoStock(producto.stock);
    setShowAjusteStock(true);
  };

  const eliminarProducto = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/productos/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          alert('✅ Producto eliminado correctamente');
          cargarDatos();
        } else {
          alert('❌ Error al eliminar producto');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar producto');
      }
    }
  };

  const formatearFecha = (fecha) => {
    const now = new Date();
    const diff = now - new Date(fecha);
    const horas = Math.floor(diff / (1000 * 60 * 60));
    
    if (horas < 1) return "Hace unos minutos";
    if (horas < 24) return `Hace ${horas}h`;
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  return (
    <div className="dashboard-vendedor-container">
      {/* Header */}
      <div className="vendedor-header">
        <div className="vendedor-header-content">
          <div className="vendedor-welcome">
            <FaUserTie className="header-icon" />
            <div>
              <h1>Panel de Vendedor - Botillería Elixir</h1>
              <p>Gestiona tu inventario de bebidas premium y monitorea tus ventas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="vendedor-main-container">
        {/* Métricas Principales */}
        <div className="metricas-grid">
          <div className="metrica-card activos">
            <div className="metrica-header">
              <h3>Productos Activos</h3>
              <FaBox className="metrica-icon" />
            </div>
            <p className="metrica-valor">{metricas.productosActivos}</p>
            <span className="metrica-label">Bebidas en catálogo</span>
          </div>

          <div className="metrica-card vendidos">
            <div className="metrica-header">
              <h3>Ventas Hoy</h3>
              <FaShoppingCart className="metrica-icon" />
            </div>
            <p className="metrica-valor">{metricas.ventasHoy}</p>
            <span className="metrica-label">Órdenes procesadas</span>
          </div>

          <div className="metrica-card ingresos">
            <div className="metrica-header">
              <h3>Ingreso Mes</h3>
              <FaDollarSign className="metrica-icon" />
            </div>
            <p className="metrica-valor">${metricas.ingresoMes.toLocaleString('es-CL')}</p>
            <span className="metrica-label">Estimado en ganancia</span>
          </div>

          <div className="metrica-card stock">
            <div className="metrica-header">
              <h3>Stock Bajo</h3>
              <FaExclamationTriangle className="metrica-icon" />
            </div>
            <p className="metrica-valor">{metricas.stockBajo}</p>
            <span className="metrica-label">Productos con stock mínimo</span>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="productos-section">
          <div className="section-header">
            <h2>
              <FaBox /> Inventario de Bebidas
            </h2>
            <button className="btn-agregar-producto" onClick={() => setShowFormProducto(!showFormProducto)}>
              <FaPlus /> Agregar Bebida
            </button>
          </div>

          {loading ? (
            <div className="loading">Cargando inventario...</div>
          ) : productos.length === 0 ? (
            <div className="empty-state">
              <FaBox className="empty-icon" />
              <p>No hay productos disponibles</p>
            </div>
          ) : (
            <div className="productos-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Nombre de la Bebida</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id} className={producto.stock < producto.stock_minimo ? 'stock-bajo' : ''}>
                      <td>{producto.nombre}</td>
                      <td>{producto.sku}</td>
                      <td>{producto.categoria?.nombre || 'Sin categoría'}</td>
                      <td>${producto.precio.toLocaleString('es-CL')}</td>
                      <td>
                        <span className={producto.stock < producto.stock_minimo ? 'stock-warning' : 'stock-ok'}>
                          {producto.stock}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-editar"
                          onClick={() => {
                            setSelectedProducto(producto);
                            setNuevoStock(producto.stock);
                            setShowAjusteStock(true);
                          }}
                        >
                          <FaEdit /> Ajustar Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Ajuste de Stock */}
        {showAjusteStock && selectedProducto && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Ajustar Stock - {selectedProducto.nombre}</h3>
                <button 
                  className="btn-close"
                  onClick={() => {
                    setShowAjusteStock(false);
                    setSelectedProducto(null);
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Stock Actual: {selectedProducto.stock}</label>
                  <input
                    type="number"
                    value={nuevoStock}
                    onChange={(e) => setNuevoStock(parseInt(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-confirmar" onClick={() => {
                  setShowAjusteStock(false);
                  cargarDatos();
                }}>
                  <FaCheck /> Confirmar
                </button>
                <button 
                  className="btn-cancelar"
                  onClick={() => {
                    setShowAjusteStock(false);
                    setSelectedProducto(null);
                  }}
                >
                  <FaTimes /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ventas Recientes */}
        <div className="ventas-recientes-section">
          <div className="section-header">
            <h2>
              <FaChartBar /> Ventas Recientes
            </h2>
          </div>

          {ventasRecientes.length === 0 ? (
            <div className="empty-state">
              <FaShoppingCart className="empty-icon" />
              <p>No hay ventas registradas aún</p>
            </div>
          ) : (
            <div className="ventas-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Monto</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRecientes.map((venta) => (
                    <tr key={venta.id}>
                      <td>{venta.cliente}</td>
                      <td>{venta.producto}</td>
                      <td>{venta.cantidad}</td>
                      <td>${venta.monto.toLocaleString('es-CL')}</td>
                      <td>{venta.fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <span className={`estado-badge ${venta.estado}`}>
                          {venta.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardVendedor;

