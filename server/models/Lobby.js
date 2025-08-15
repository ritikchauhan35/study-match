import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  subjects: {
    type: [String],
    required: true,
    index: true, // Index for faster searching on subjects
  },
  user_count: {
    type: Number,
    default: 1,
    min: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: {
    virtuals: true, // Ensure virtuals are included in toJSON output
    transform: function(doc, ret) {
      delete ret._id; // remove _id
      delete ret.__v; // remove __v
    }
  },
  toObject: {
    virtuals: true,
  }
});

// Virtual property to check if the lobby is full
lobbySchema.virtual('is_full').get(function() {
  // Capacity is 4 for this application
  return this.user_count >= 4;
});

// Virtual property for 'id' to match frontend expectations
lobbySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Rename `updatedAt` to `last_activity` to match frontend expectations
lobbySchema.virtual('last_activity').get(function() {
    return this.updatedAt;
});


const Lobby = mongoose.model('Lobby', lobbySchema);

export default Lobby;
