<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('trip.{tripId}', function ($user, $tripId) {
    return !is_null($user);
});

Broadcast::channel('admin.notifications', function ($user) {
    return $user && $user->role === 'admin';
});

// Hội thoại: cho phép admin hoặc người tham gia (customer/agent) nghe realtime
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return $user && \App\Models\Conversation::query()
        ->where('id', $conversationId)
        ->where(function ($q) use ($user) {
            $q->where('customer_id', $user->id)
                ->orWhere('agent_id', $user->id)
                ->orWhereRaw('? = ?', [$user->role, 'admin']);
        })
        ->exists();
});

// Kênh cho admin nhận sự kiện khi tạo hội thoại mới
Broadcast::channel('admin.conversations', function ($user) {
    return $user && $user->role === 'admin';
});

// Kênh cho user nhận thông báo cá nhân
Broadcast::channel('user.notifications.{userId}', function ($user, $userId) {
    return $user && (int) $user->id === (int) $userId;
});