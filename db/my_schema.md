## NSS dashboard

> for your convinience my linking means - foreign key 
> don't apply strict rules or policies on the hours that will be alloted to ind. volunteers as if there is partial participation, we heads can manually change the hours later

> roles : ( all this are small set under universal set volunteer simplifying the stuff)
- admin ( Me myself having all the control)
- program_officer ( just can view all the data similar to admin, but can't edit anything)
- Heads ( can create events, assign hours etc, as per our nss-app-dashboard)

> how everything is normailized properly is :
- All the people in the auth_id ( users ) come under volunteers ( vol. is a big universal set), where we will be linking
- volunteers -> role_id -> auth_id, where role_id for specific user_will be set either manually, or can be set by only the admin_role itself, there will be single admin role
- as per the roles, the role_id will be linked to the volunteers, further in front-end there will be private routing where, where as per sign-in and meta-data user will redirect to their role-dashboard automatically (that we will do it later)


volunteers 
- id   ( this will be linked to the roles ID , so further in frontend we could route the roles properly )
- first_name
- last_name
- roll_number ( college format, NOT INT, eg. 23108A0054, 23104B0068) unique
- email (college) unique
- branch ( eg. EXCS,CMPN,IT, BIO-MED, EXTC) # in NSS upto TE ( third yr engineering only)
- Year  ( eg. FE,SE,TE)
- phone_no
- birth_date
- gender ( M, F, Prefer not to say)
- nss_join_year
- address
- profile_pic -> linking later to the supabase storage !
- created_at
- updated_at


event_categories
- id
- name ( Event types - AB1, AB2, University Events, College Events )
- description
- created_at
- updated_at

events
- id
- name
- description
- event_date
- declared_hours
- category_id ( linked to event categories )
- min_participants
- created_at
- updated_at


event_participation 
- id ( linked to the event_id )
- volunteer_id ( linked to the volunteer table)
- hours_attended ( if participation_status == true, hours_attended == declared_hours ( from events))
- participation_status ( present, absent, partially present)

roles
- id ( this id will be linked to supabase auth_id, which will be automatically routed by private routing as per the role)
- role
- description
- permissions
- created_at
- updated_at


auth
- default table of the supabase

> we wil just link the auth_id further with roles and so on !!!!
