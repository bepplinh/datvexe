<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'status' => $this->status,
            'last_message_at' => optional($this->last_message_at)->toISOString(),
            'customer' => new UserMiniResource($this->whenLoaded('customer')),
            'agent' => new UserMiniResource($this->whenLoaded('agent')),
            'messages_count' => $this->when(isset($this->messages_count), $this->messages_count),
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
            'last_message' => new MessageResource($this->whenLoaded('lastMessage')),
        ];
    }
}

