Texture BulletValuesTexture;
sampler BulletValuesSampler = 
sampler_state
{
	texture = <BulletValuesTexture>;
	AddressU = Wrap;
	AddressV = Wrap;
};

Texture RayDetailTexture;
sampler RayDetailSampler = 
sampler_state
{
	texture = <RayDetailTexture>;
	AddressU = Wrap;
	AddressV = Wrap;
};

sampler TextureSampler : register(s0)=
sampler_state
{
    AddressU = Wrap;
    AddressV = Wrap;
};
sampler OverlaySampler : register(s1) = 
sampler_state
{
    AddressU = Wrap;
    AddressV = Wrap;
    MipFilter = Linear;
    MinFilter = Linear;
    MagFilter = Linear;
};

//Explosions
float3 impacts[7];
int impactCount; 
float aspectRatio = 1.333;

//Bullets
float3 bullets[1];
int bulletCount = 3;
float rayRow = 0;

float4 main(float4 color : COLOR0, float2 texCoord : TEXCOORD0) : COLOR0
{
    // Look up the texture color.    
    float4 tex = tex2D(TextureSampler, texCoord);
    
    
    // Sampling the Red value in the overlay texture at the current texture coordinate
    // in order to determine the amount of the original image we can see.  We pick red 
    // arbitrarily since we declarced our overlay image to use one byte per pixel representing
    // luminosity, thus red, blue and green are all equivalent in this case.
    tex.a = tex2D(OverlaySampler, texCoord).r;    
   
    return tex;
}


float4 distort(float4 color : COLOR0, float2 texCoord : TEXCOORD0) : COLOR0
{
	// Sampling the Red value in the overlay texture at the current texture coordinate
    // in order to determine the amount of the original image we can see.  We pick red 
    // arbitrarily since we declarced our overlay image to use one byte per pixel representing
    // luminosity, thus red, blue and green are all equivalent in this case.
    float4 sampleCoord = tex2D(OverlaySampler, texCoord);
    //float4 sampleCoord2 = tex2D(OverlaySampler, texCoord)

    // Look up the texture color.    
    float4 tex = tex2D(TextureSampler, texCoord + float2(sampleCoord.r,sampleCoord.g));
    
    return tex;
}

float4 impactDistort(float4 color : COLOR0, float2 texCoord : TEXCOORD0) : COLOR0
{
	float2 offset = float2(0,0);
	float distSq;
	float2 tmp;
	
	for( int i = 0; i < impactCount; i++)
	{
		tmp = (texCoord - impacts[i]);
		//tmp = (impacts[i] - texCoord);
		distSq = pow(length(tmp),2);
		offset += (impacts[i].b * tmp) / distSq;
	}
	offset.y *= aspectRatio;
	float4 visibility = tex2D(OverlaySampler, texCoord + offset);
    // Look up the texture color.    
    float4 tex = tex2D(TextureSampler, texCoord + offset);
    tex.a = visibility.r;
    tex.r += 2 * length(offset);
    return tex;
}

float4 blurBullets(float2 texCoord : TEXCOORD0) : COLOR0
{
	float dist;
	float2 diff, offset = 0;
	float val = 0;
	for(int i = 0; i < bulletCount; i++)
	{
		diff = bullets[i].xy - texCoord;
		diff.y /= aspectRatio;
		dist = length(diff);
		val += 0.007 / dist;
	}
	return  float4(val, val, val, val);
}

float4 glowBullets(float2 texCoord : TEXCOORD) : COLOR0
{
	float val = 0, tmp, distance;
	float2 delta;
	for(int i = 0; i < bulletCount; i++)
	{
		delta = texCoord - bullets[i].xy;
		delta.y /= aspectRatio;
		distance = dot(delta, delta);
		distance = pow(distance, .5);
		tmp = 0.013 / distance;
		
		float theta = acos(dot(normalize(delta),float2(1,0))) / 3.14159265;

		if( delta.y > 0){
			theta *= -1;
		}
	
		val += tmp * tex2D(RayDetailSampler, float2(theta, rayRow + bullets[i].z)).r;
	}
	
    return float4(0, val, val, val);
}

float4 glowBullets2(float2 texCoord : TEXCOORD) : COLOR0
{
	float val = 0, tmp, distance;
	float2 delta;
	float step  = 1.0 / float(bulletCount);
	for(int i = 0; i < bulletCount; i++)
	{
		float4 bulletData = tex2D(BulletValuesSampler, float2(i * step,0));
		delta = texCoord - bulletData.xy;
		delta.y /= aspectRatio;
		distance = dot(delta, delta);
		distance = pow(distance, .5);
		tmp = 0.013 / distance;
		
		float theta = acos(dot(normalize(delta),float2(1,0))) / 3.14159265;

		if( delta.y > 0){
			theta *= -1;
		}
	
		val += tmp * tex2D(RayDetailSampler, float2(theta, rayRow + bulletData.z)).r;
	}
	
    return float4(0, val, val, val);
}

float4 impactDistort2(float4 color : COLOR0, float2 texCoord : TEXCOORD0) : COLOR0
{
	float2 offset = float2(0,0);
	float distSq;
	float2 tmp;
	
	for( int i = 0; i < impactCount; i++)
	{
		tmp = (texCoord - impacts[i]);
		//tmp = (impacts[i] - texCoord);
		distSq = pow(length(tmp),2);
		offset += (impacts[i].b * tmp) / distSq;
	}
	offset.y *= aspectRatio;
	float4 visibility = tex2D(OverlaySampler, texCoord + offset);
    // Look up the texture color.    
    float4 tex = tex2D(TextureSampler, texCoord + offset);
    tex.a = visibility.r;
    tex.r += 2*length(offset);
    
    float dist;
	float2 diff;
	float val = 0;
	for(i = 0; i < bulletCount; i++)
	{
		diff = bullets[i].xy - texCoord;
		dist = length(diff);
		val += 0.007 / dist;
	}
   
    return tex + float4(val, val, val, val);
}

technique Desaturate
{
	pass pass1
    {
        PixelShader = compile ps_3_0 glowBullets2();
        
        AlphaBlendEnable = True;
        //SeparateAlphaBlendEnable = true;
		SrcBlend = one;
		DestBlend = zero;
		//SrcBlendAlpha = one;
		//destblendalpha = destalpha;
    }

	pass pass0
	{
		PixelShader = compile ps_2_0 impactDistort();
		//SeparateAlphaBlendEnable = true;
		AlphaBlendEnable = True;
		SrcBlend = srcAlpha;
		DestBlend = destAlpha;//DESTALPHA;
		
		//SrcBlendAlpha = destalpha;
		//destblendalpha = one;
	}
	
	
 
}
