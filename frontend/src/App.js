import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useParams } from 'react-router-dom';
import API from './api';

const Auth = ({ setToken }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                const { data } = await API.post('/auth/login', form);
                localStorage.setItem('token', data.token);
                setToken(data.token);
                navigate('/');
            } else {
                await API.post('/auth/register', form);
                setIsLogin(true);
                alert('Registered successfully! Please log in.');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error occurred');
        }
    };

    return (
        <div>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '200px', gap: '10px' }}>
                <input type="text" placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} required />
                <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '10px' }}>
                Switch to {isLogin ? 'Register' : 'Login'}
            </button>
        </div>
    );
};

const Home = ({ token }) => {
    const [posts, setPosts] = useState([]);
    const [form, setForm] = useState({ title: '', content: '' });

    useEffect(() => {
        API.get('/posts').then(res => setPosts(res.data));
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        const { data } = await API.post('/posts', form);
        setPosts([data, ...posts]);
        setForm({ title: '', content: '' });
    };

    // The New Edit Function
    const handleEdit = async (post) => {
        const newTitle = window.prompt('Edit Title:', post.title);
        const newContent = window.prompt('Edit Content:', post.content);
        
        if (newTitle && newContent) {
            try {
                const { data } = await API.put(`/posts/${post._id}`, { title: newTitle, content: newContent });
                setPosts(posts.map(p => p._id === post._id ? data : p));
            } catch (error) {
                alert('Error updating post. Are you the author?');
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/posts/${id}`);
            setPosts(posts.filter(p => p._id !== id));
        } catch (error) {
            alert('Error deleting post. Are you the author?');
        }
    };

    return (
        <div>
            <h2>Blog Posts</h2>
            {token && (
                <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px', marginBottom: '20px' }}>
                    <h3>Create New Post</h3>
                    <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                    <textarea placeholder="Content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
                    <button type="submit">Submit Post</button>
                </form>
            )}
            <div>
                {posts.map(post => (
                    <div key={post._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                        <h3><Link to={`/post/${post._id}`}>{post.title}</Link></h3>
                        <p>{post.content}</p>
                        <small>By: {post.author?.username || 'Unknown'} | {new Date(post.createdAt).toLocaleDateString()}</small>
                        <br />
                        {token && (
                            <div style={{ marginTop: '10px' }}>
                                <button onClick={() => handleEdit(post)} style={{ marginRight: '10px', color: 'blue' }}>Edit Post</button>
                                <button onClick={() => handleDelete(post._id)} style={{ color: 'red' }}>Delete Post</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const PostDetail = ({ token }) => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        API.get(`/posts/${id}`).then(res => setPost(res.data));
    }, [id]);

    const handleComment = async (e) => {
        e.preventDefault();
        const { data } = await API.post(`/posts/${id}/comments`, { text: comment });
        setPost(data);
        setComment('');
    };

    if (!post) return <div>Loading...</div>;

    return (
        <div>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
            <small>By: {post.author?.username || 'Unknown'}</small>
            <hr />
            <h3>Comments</h3>
            {post.comments.map((c, i) => (
                <p key={i}><strong>{c.author?.username || 'User'}:</strong> {c.text}</p>
            ))}
            {token && (
                <form onSubmit={handleComment} style={{ marginTop: '20px' }}>
                    <input type="text" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} required />
                    <button type="submit">Comment</button>
                </form>
            )}
        </div>
    );
};

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <Router>
            <nav style={{ padding: '10px', background: '#f4f4f4', marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <Link to="/">Home</Link>
                {!token ? (
                    <Link to="/auth">Login / Register</Link>
                ) : (
                    <button onClick={logout}>Logout</button>
                )}
            </nav>
            <div style={{ padding: '0 20px' }}>
                <Routes>
                    <Route path="/" element={<Home token={token} />} />
                    <Route path="/auth" element={<Auth setToken={setToken} />} />
                    <Route path="/post/:id" element={<PostDetail token={token} />} />
                </Routes>
            </div>
        </Router>
    );
}