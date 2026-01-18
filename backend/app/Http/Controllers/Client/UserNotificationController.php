<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    /**
     * List notifications for authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = UserNotification::query()
            ->where('user_id', $user->id)
            ->latest();

        // Filter by read status
        if ($request->has('is_read')) {
            $isRead = filter_var($request->input('is_read'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $limit = $request->integer('limit', 20);
        $page = $request->integer('page', 1);

        $notifications = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => UserNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, UserNotification $notification)
    {
        // Ensure user owns this notification
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json(['data' => $notification]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        UserNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get unread count only
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $count = UserNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }
}
