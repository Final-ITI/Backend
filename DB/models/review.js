import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },
        halaka: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Halaka",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        reviewText: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// Prevent student from submitting multiple reviews for the same halaka
reviewSchema.index({ student: 1, halaka: 1 }, { unique: true });

// Static method to update teacher's average rating and review count
reviewSchema.statics.updateTeacherStats = async function (teacherId) {
    const stats = await this.aggregate([
        { $match: { teacher: mongoose.Types.ObjectId(teacherId) } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, numOfReviews: { $sum: 1 } } },
    ]);
    const avgRating = stats.length > 0 ? stats[0].avgRating : 0;
    const numOfReviews = stats.length > 0 ? stats[0].numOfReviews : 0;
    await mongoose.model("Teacher").findByIdAndUpdate(
        teacherId,
        { "performance.rating": avgRating, "performance.numOfReviews": numOfReviews },
        { new: true }
    );
};

// Post-save and post-remove hooks to update teacher stats
reviewSchema.post("save", async function (doc) {
    await doc.constructor.updateTeacherStats(doc.teacher);
});
reviewSchema.post("remove", async function (doc) {
    await doc.constructor.updateTeacherStats(doc.teacher);
});

const Review = mongoose.model("Review", reviewSchema);

export default Review; 