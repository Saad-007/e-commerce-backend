const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 1000 // Practical upper limit
    },
    image: {
      type: String
    },
    _id: false // Prevent automatic _id creation for subdocuments
  }],
  shippingAddress: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: props => `${props.value} is not a valid email!`
      }
    },
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    zip: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      default: 'United States',
      trim: true
    },
    phone: {
      type: String,
      validate: {
        validator: v => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(v),
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    _id: false
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'upi', 'cod'],
    default: 'credit_card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
 status: {
  type: String,
  enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'], // ✅ Add 'completed'
  default: 'pending'
},

  statusHistory: [{
    status: {
  type: String,
  enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'] // ✅ Add 'completed'
},

    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      maxlength: 200
    },
    _id: false
  }],
  cancellation: {
    reason: {
      type: String,
      maxlength: 500
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    set: v => parseFloat(v.toFixed(2)) // Ensure 2 decimal places
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    code: String,
    amount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  trackingNumber: {
    type: String,
    index: true
  },
  deliveryDate: Date,
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v; // Remove version key
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// ✅ Add this before pre('save')
const validTransitions = {
  pending: ['processing', 'shipped', 'cancelled', 'completed'],
  processing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'completed'],
  delivered: ['completed'],
  completed: [],
  cancelled: []
};
orderSchema.pre('init', function(doc) {
  this._originalStatus = doc.status;
});

// Status transition validation
orderSchema.pre('init', function(doc) {
  this._originalStatus = doc.status;
});

// Virtual for formatted order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: 1 });
orderSchema.index({ 'paymentStatus': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ total: 1 });
orderSchema.index({ 'shippingAddress.email': 1 });

// Query helper for active orders
orderSchema.query.active = function() {
  return this.where({ status: { $nin: ['cancelled', 'delivered'] } });
};

// Static method for order stats
orderSchema.statics.getStatusCounts = async function() {
  return this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;