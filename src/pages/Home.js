import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Nav, Form, InputGroup } from 'react-bootstrap';
import { 
  Search, 
  House, 
  Cart, 
  Person, 
  Heart,
  ChevronRight
} from 'react-bootstrap-icons';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);

        // Fetch products
        let productsQuery = collection(db, 'products');
        if (selectedCategory) {
          productsQuery = query(productsQuery, where('category', '==', selectedCategory));
        }
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="text-danger mb-3">
            <i className="bi bi-exclamation-circle-fill fs-1"></i>
          </div>
          <h5 className="text-danger">{error}</h5>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Fixed Header */}
      <header className="fixed-top bg-white shadow-sm">
        <Container fluid className="px-3 py-2">
          <Row className="align-items-center">
            <Col xs="auto">
              <h1 className="h5 mb-0">AnA Group</h1>
            </Col>
            <Col>
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-end-0"
                />
                <InputGroup.Text className="bg-white border-start-0">
                  <Search />
                </InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>
        </Container>

        {/* Categories Scrollbar */}
        <div className="border-top overflow-auto">
          <Container fluid className="px-3">
            <Nav className="flex-nowrap py-2 gap-2">
              <Nav.Item>
                <Button
                  variant={selectedCategory === null ? "primary" : "light"}
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-pill px-3 py-1"
                >
                  All
                </Button>
              </Nav.Item>
              {categories.map(category => (
                <Nav.Item key={category.id}>
                  <Button
                    variant={selectedCategory === category.id ? "primary" : "light"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="rounded-pill px-3 py-1 text-nowrap"
                  >
                    {category.name}
                  </Button>
                </Nav.Item>
              ))}
            </Nav>
          </Container>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 mt-5 pt-5">
        <Container fluid className="px-3">
          {categories.map(category => {
            const categoryProducts = filteredProducts.filter(p => p.category === category.id);
            if (categoryProducts.length === 0) return null;

            return (
              <section key={category.id} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 mb-0">{category.name}</h2>
                  <Link 
                    to={`/products?category=${category.id}`}
                    className="text-primary text-decoration-none d-flex align-items-center"
                  >
                    View All
                    <ChevronRight className="ms-1" />
                  </Link>
                </div>

                <Row className="g-3">
                  {categoryProducts.slice(0, 6).map(product => (
                    <Col xs={6} md={4} lg={3} key={product.id}>
                      <Card className="h-100 border-0 shadow-sm">
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                            src={product.image}
                            alt={product.name}
                            style={{
                              height: '160px',
                              objectFit: 'cover'
                            }}
                          />
                          {product.stock <= 0 && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
                              <span className="badge bg-danger">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <Card.Body className="p-2">
                          <Card.Title className="h6 mb-2">
                            {product.name}
                          </Card.Title>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-primary">
                              TZS {parseFloat(product.price).toLocaleString()}
                            </span>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              disabled={product.stock <= 0}
                              className="rounded-circle p-1"
                            >
                              <Cart size={16} />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </section>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No products found</p>
            </div>
          )}
        </Container>
      </main>

      {/* Fixed Bottom Navigation */}
      <Nav className="fixed-bottom bg-white border-top">
        <Container fluid className="px-0">
          <Row className="w-100 mx-0">
            <Col className="p-0">
              <Nav.Link as={Link} to="/" className="text-center py-2 text-dark">
                <House className="mb-1" size={20} />
                <div className="small">Home</div>
              </Nav.Link>
            </Col>
            <Col className="p-0">
              <Nav.Link as={Link} to="/categories" className="text-center py-2 text-dark">
                <Search className="mb-1" size={20} />
                <div className="small">Search</div>
              </Nav.Link>
            </Col>
            <Col className="p-0">
              <Nav.Link as={Link} to="/cart" className="text-center py-2 text-dark">
                <Cart className="mb-1" size={20} />
                <div className="small">Cart</div>
              </Nav.Link>
            </Col>
            <Col className="p-0">
              <Nav.Link as={Link} to="/wishlist" className="text-center py-2 text-dark">
                <Heart className="mb-1" size={20} />
                <div className="small">Wishlist</div>
              </Nav.Link>
            </Col>
            <Col className="p-0">
              <Nav.Link as={Link} to="/profile" className="text-center py-2 text-dark">
                <Person className="mb-1" size={20} />
                <div className="small">Profile</div>
              </Nav.Link>
            </Col>
          </Row>
        </Container>
      </Nav>
    </div>
  );
};

export default Home;
