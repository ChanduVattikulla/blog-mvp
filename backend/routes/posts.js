const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a post
router.post('/', auth, async (req, res) => {
    try {
        const newPost = new Post({ ...req.body, author: req.user.id });
        await newPost.save();
        
        const populatedPost = await newPost.populate('author', 'username');
        res.json(populatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username')
            .populate('comments.author', 'username');
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.push({ text: req.body.text, author: req.user.id });
        await post.save();
        
        const updatedPost = await Post.findById(req.params.id)
            .populate('author', 'username')
            .populate('comments.author', 'username');
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update post (The New Feature)
router.put('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        // Security check: Only the author can edit
        if (post.author.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
        
        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;
        await post.save();
        
        const updatedPost = await Post.findById(req.params.id).populate('author', 'username');
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        if (post.author.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
        await post.deleteOne();
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;