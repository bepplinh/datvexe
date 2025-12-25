<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConversationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy 1 số user để làm khách hàng và admin
        $customers = User::query()
            ->where('role', 'customer')
            ->take(5)
            ->get();

        $admins = User::query()
            ->where('role', 'admin')
            ->take(3)
            ->get();

        if ($customers->isEmpty() || $admins->isEmpty()) {
            return;
        }

        foreach ($customers as $customer) {
            $agent = $admins->random();

            /** @var Conversation $conversation */
            $conversation = Conversation::factory()->create([
                'customer_id' => $customer->id,
                'agent_id' => $agent->id,
                'status' => 'open',
            ]);

            // Tạo đoạn hội thoại mẫu giữa khách và admin
            $messagesData = [
                [
                    'from' => 'customer',
                    'content' => 'Hi, mình cần hỗ trợ về đơn hàng gần đây.',
                ],
                [
                    'from' => 'admin',
                    'content' => 'Chào bạn! Bạn vui lòng cho mình xin mã đơn hàng nhé?',
                ],
                [
                    'from' => 'customer',
                    // dùng helper fake() thay vì $this->faker vì seeder không có property faker
                    'content' => 'Mã đơn là #ORD-' . fake()->numberBetween(10000, 99999),
                ],
                [
                    'from' => 'admin',
                    'content' => 'Cảm ơn bạn, đơn hàng đang được xử lý và dự kiến giao trong 24h tới.',
                ],
            ];

            $createdAt = now()->subMinutes(10);

            foreach ($messagesData as $data) {
                $sender = $data['from'] === 'customer' ? $customer : $agent;
                /** @var Message $message */
                $message = Message::factory()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sender->id,
                    'content' => $data['content'],
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $createdAt = $createdAt->addMinutes(2);

                $conversation->last_message_at = $message->created_at;
                $conversation->save();
            }
        }
    }
}
