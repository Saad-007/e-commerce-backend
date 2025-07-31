const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  id: String,
  color: String,
  size: String,
  stock: {
    type: Number,
    min: 0,
    default: 0
  },
  price: Number,
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  sold: {
    type: Number,
    default: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  featured: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  offerPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v) {
        return v <= this.price;
      },
      message: props => `Offer price (${props.value}) must be less than regular price`
    }
  },
  description: String,
  quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  sold: {
    type: Number,
    min: 0,
    default: 0
  },
  salesCount: {
    type: Number,
    min: 0,
    default: 0
  },
  variants: [variantSchema],
  tags: [String],
  image: String,
  images: [String],
  status: {
    type: Boolean,
    default: true
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    methods: [
      {
        type: { type: String },
        price: Number
      }
    ],
    processingTime: String
  },
  salesHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    quantity: Number,
    revenue: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

productSchema.virtual('totalStock').get(function () {
  return (this.quantity || 0) + ((this.variants || []).reduce((sum, variant) => sum + (variant.stock || 0), 0));
});

productSchema.virtual('totalSold').get(function () {
  return (this.sold || 0) + ((this.variants || []).reduce((sum, variant) => sum + (variant.sold || 0), 0));
});



productSchema.pre('save', function(next) {
  if (this.isModified('variants')) {
    const variants = this.variants || [];
    this.quantity = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  }
  next();
});


module.exports = mongoose.model("Product", productSchema);