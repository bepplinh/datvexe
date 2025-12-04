<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'content' => $this->content,
            'message_type' => $this->message_type,
            'delivery_status' => $this->delivery_status,
            'metadata' => $this->metadata,
            'delivered_at' => optional($this->delivered_at)->toISOString(),
            'read_at' => optional($this->read_at)->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'sender' => new UserMiniResource($this->whenLoaded('sender')),
        ];
    }
}

