import mongoose from 'mongoose';
const { Schema } = mongoose;

// Custom validator for Quill Delta format
const quillDeltaValidator = (v) => {
    return v != null && typeof v === 'object' && Array.isArray(v.ops);
};

// Sub-schema for individual change logs
const changeLogSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    delta: {
        type: Object,
        required: true,
        validate: [quillDeltaValidator, 'delta must be an object with an ops array (Quill Delta JSON).']
    },
}, { 
    timestamps: { createdAt: true, updatedAt: false }
});

const documentSchema = new Schema({
  data: { 
      type: Object, 
      default: { ops: [] },
      validate: [quillDeltaValidator, 'data must be an object with an ops array (Quill Delta JSON).']
  },
  title: { 
      type: String, 
      default: 'Untitled Document' 
  },
  owner: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
  },
  collaborators: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
  }],
  history: [changeLogSchema],
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);